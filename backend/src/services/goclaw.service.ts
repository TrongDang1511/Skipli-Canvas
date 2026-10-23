import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { env } from '../config/env.config';
import { goclawConfig } from '../config/goclaw.config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  text: string;
}

export interface ChatCompletionOptions {
  history?: ChatMessage[];
  codeUrl?: string;
  sessionTitle?: string;
}

export class GoClawService {
  public classifyIntent(
    prompt: string,
    isInitialTurn: boolean = false
  ): 'CONSULTATION' | 'CODE_OPERATION' {
    if (!prompt || !prompt.trim()) return isInitialTurn ? 'CODE_OPERATION' : 'CONSULTATION';

    const clean = prompt.toLowerCase().trim();

    // 1. Explicit force-override: Command to apply, build, or implement immediately
    const forceActionPatterns = [
      /\b(apply|implement|execute)\b/i,
      /\b(do it|make the change|make those changes|apply (it|them|this|the changes))\b/i,
      /\b(go ahead and (update|change|add|fix|make|swap|restyle))\b/i,
      /\b(sửa luôn|làm luôn|áp dụng|thực hiện ngay|cập nhật ngay)\b/i,
    ];
    if (forceActionPatterns.some((pattern) => pattern.test(clean))) {
      return 'CODE_OPERATION';
    }

    // 2. Comprehensive Consultation & Advisory Patterns (English + Vietnamese)
    const consultPatterns = [
      // Direct inquiry / Advice words
      /\b(advice|advise|suggestion|suggestions|suggest|recommend|recommendations|critique|feedback|review|evaluate|evaluation|assessment|ideas?|brainstorm|thoughts?|opinion|inspiration)\b/i,
      // Questions about design, strategy, aesthetics
      /\b(what do you think|what are your thoughts|how do you feel about|what would you (do|recommend|suggest|choose))\b/i,
      /\b(any (ideas|suggestions|thoughts|advice|tips|recommendations|alternatives))\b/i,
      /\b(give me (advice|ideas|feedback|suggestions|critique|tips|options))\b/i,
      /\b(pros and cons|difference between|best practices?|is it better to|should (i|we)|could (i|we))\b/i,
      /\b(how (can|should|do|would) (i|we|users|customers))\b/i,
      /\b(why (is|should|would|does))\b/i,
      /\b(explain|tell me (about|more)|what is the (best|difference))\b/i,
      // Vietnamese consultation keywords
      /\b(tư vấn|gợi ý|ý kiến|nghĩ sao|có nên|đánh giá|nhận xét|góp ý|chia sẻ|giải thích|là gì|như thế nào|làm sao|theo bạn)\b/i,
    ];

    // 3. Comprehensive Code Action & Modification Patterns (English + Vietnamese)
    const actionPatterns = [
      // Create / Build
      /\b(create|build|generate|develop|design|code|launch|put together|set up|setup|start)\b/i,
      // Modify / Update / Restyle
      /\b(update|modify|change|tweak|adjust|customize|edit|restyle|redesign|revamp|rework|reorganize|refactor|recolor|retheme|rewrite|revise)\b/i,
      // Add / Insert / Embed
      /\b(add|insert|include|embed|append|attach|place|put|integrate)\b/i,
      // Remove / Delete / Hide
      /\b(remove|delete|drop|hide|omit|get rid of|take out|eliminate|strip out)\b/i,
      // Replace / Swap / Switch / Fix
      /\b(replace|swap|switch|substitute|fix|repair|correct|resolve|patch)\b/i,
      // Colloquial English command phrases: "make the...", "turn the...", "make it...", "hook up..."
      /\b(make (the|it)|turn (the|it)|set (the|it)|swap (the|out)|switch (to|the)|hook up)\b/i,
      // Vietnamese action keywords
      /\b(tạo web|làm web|xây dựng|viết code|thiết kế web|sửa|đổi màu|thay màu|đổi font|thay ảnh|đổi ảnh|thêm|bớt|xóa|cập nhật|thay đổi|áp dụng|triển khai|viết lại)\b/i,
    ];

    const hasConsult = consultPatterns.some((pattern) => pattern.test(clean));
    const hasAction = actionPatterns.some((pattern) => pattern.test(clean));

    // Pure consultation without any action commands
    if (hasConsult && !hasAction) {
      return 'CONSULTATION';
    }

    // Question structure detection: if user asks a question with "?" and has consultation cues
    if (clean.includes('?') && hasConsult) {
      return 'CONSULTATION';
    }

    // Direct action command
    if (hasAction) {
      return 'CODE_OPERATION';
    }

    // 4. Structural Fallback for prompts with NO explicit keywords:
    // Case A: Initial Turn (no web yet) -> user describes their business or what they want built
    if (isInitialTurn) {
      // Unless they specifically asked a question with "?", default to building the website
      if (clean.includes('?') && (clean.startsWith('what') || clean.startsWith('how') || clean.startsWith('why') || clean.startsWith('can you'))) {
        return 'CONSULTATION';
      }
      return 'CODE_OPERATION';
    }

    // Case B: Turn 2+ (existing web already exists)
    // If the prompt is ambiguous or outside keywords, it is MUCH safer to treat as CONSULTATION (chat)
    // rather than accidentally rebuilding or modifying the page when user was just commenting!
    return 'CONSULTATION';
  }

  public async chatCompletion(
    prompt: string,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    const { history = [], codeUrl, sessionTitle } = options;

    let finalPrompt = '';

    const historyBlock =
      history && history.length > 0
        ? `\n\n[CONVERSATION HISTORY (LAST 10 MESSAGES)]:\n` +
          history
            .map((msg) => `${msg.role === 'user' ? 'User' : 'AI Assistant'}: ${msg.content}`)
            .join('\n\n')
        : '';

    const isInitialTurn = !codeUrl || !codeUrl.trim();
    const intent = this.classifyIntent(prompt, isInitialTurn);
    const intentLabel =
      intent === 'CONSULTATION'
        ? 'CONSULTATION & STRATEGY ADVICE'
        : isInitialTurn
        ? 'NEW WEBSITE CREATION (INITIAL BUILD)'
        : 'CODE REFINEMENT (UPDATE & EDIT)';

    const hasVietnameseMarks = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(prompt);
    const languageInstruction = hasVietnameseMarks
      ? '1. Language Adaptation: The user is communicating in Vietnamese. You MUST generate all website copy and formulate your chat reply strictly in Vietnamese.'
      : '1. Language Adaptation: Strictly match the user\'s language. If English, generate all website copy and formulate your chat reply strictly in English. If another language, adapt accordingly.';

    if (codeUrl && codeUrl.trim()) {
      // Turn 2+ with presigned S3 URL
      finalPrompt = `[REQUEST CLASSIFICATION]: ${intentLabel}

[CURRENT SOURCE CODE URL]:
${codeUrl}
${historyBlock}

[USER REQUIREMENTS]:
"${prompt}"

[EXECUTION WORKFLOW & SKILL GUIDELINES]:
${languageInstruction}
2. Execution Workflow:
${
  intent === 'CONSULTATION'
    ? `   - CONSULTATION REQUEST: You may call 'web_fetch' with url="${codeUrl}" and extractMode="text" if needed to inspect the current code, or formulate direct, insightful architectural advice in chat. Strictly DO NOT call 'write_file'.`
    : `   - CODE REFINEMENT / UPDATE REQUEST:
     * Step 1: Call tool 'web_fetch' with url="${codeUrl}" and extractMode="text" to inspect the full current HTML code.
     * Step 2: Refine the code strictly per user instructions, adhering to all equipped design standards (Tailwind CDN, Lucide CDN, Vanilla JS Cart, 8 core sections). NEVER call 'use_skill' or 'read_file'.
     * Step 3: Call tool 'write_file' with filename "[topic]_${Date.now()}.html" (or "index.html") EXACTLY ONCE to save the complete single-file HTML document (>200 lines).
     * Step 4 (Hard-Stop): After writing the file, NEVER call 'list_files' or any other tool. Stop immediately and summarize your design updates in the user's language. Never output raw HTML code or \`\`\`html blocks in chat.`
}`;
    } else {
      // Turn 1 (Initial Creation)
      finalPrompt = `[REQUEST CLASSIFICATION]: ${intentLabel}
${historyBlock}

[USER REQUIREMENTS]:
"${prompt}"

[EXECUTION WORKFLOW & SKILL GUIDELINES]:
${languageInstruction}
2. Execution Workflow:
${
  intent === 'CONSULTATION'
    ? `   - CONSULTATION REQUEST: Analyze, brainstorm, and advise on brand identity, color schemes, and layout directly in chat. Strictly DO NOT call 'write_file'.`
    : `   - WEBSITE CREATION REQUEST:
     * Build a complete, responsive, zero-laziness single-page web app (>200 lines of code with all 8 core sections) adhering to equipped design standards (Tailwind CDN, Lucide CDN, Vanilla JS Cart). NEVER call 'use_skill' or 'read_file'.
     * Use elegant SVG Placeholders with camera icon and 'Click to upload image' (or 'Chạm để tải ảnh' if Vietnamese) or sharp Unsplash images for media.
     * Call tool 'write_file' with filename "[topic]_${Date.now()}.html" (or "index.html") EXACTLY ONCE to save the single-file HTML to workspace.
     * Hard-Stop: After writing the file, NEVER call 'list_files' or any other tool. Stop immediately and summarize your design highlights in the user's language.
     * Never output raw HTML code or \`\`\`html blocks in chat.`
}`;
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: goclawConfig.systemPrompt,
      },
      ...history,
      {
        role: 'user',
        content: finalPrompt,
      },
    ];

    try {
      const response = await axios.post(
        goclawConfig.completionsEndpoint,
        {
          model: goclawConfig.agentId,
          messages,
          stream: false,
          max_tokens: 32768,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${goclawConfig.gatewayToken}`,
            'X-GoClaw-User-Id': goclawConfig.userId,
            'X-GoClaw-Agent-Id': goclawConfig.agentId,
          },
          timeout: 0,
        }
      );

      const responseData = response.data;
      const content =
        responseData?.choices?.[0]?.message?.content ||
        responseData?.content ||
        '';

      return { text: content };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new Error(`GoClaw Engine Error: ${errorMsg}`);
      }
      throw error;
    }
  }

  public cleanTextResponse(rawText: string, userPrompt?: string): string {
    const isVietnamese = Boolean(
      userPrompt &&
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(userPrompt)
    );

    if (!rawText || !rawText.trim()) {
      return isVietnamese
        ? 'Tôi đã hoàn thành giao diện website theo đúng yêu cầu của bạn. Toàn bộ mã nguồn đã được tải trực tiếp vào khung xem trước (Live Preview). Bạn có thể xem ngay hoặc sử dụng chế độ chỉnh sửa trực quan (Visual Editor) để tinh chỉnh nhé!'
        : "I have updated the website interface according to your requirements. The updated code is loaded directly into the Live Preview. You can explore it now or use the Visual Editor for hands-on adjustments!";
    }
    let cleaned = rawText;

    // 1. Strip code blocks ```html ... ``` or ``` ... ```
    cleaned = cleaned.replace(/```(?:html|xml|css|javascript|js)?[\s\S]*?```/gi, '');
    // 2. Strip unclosed code block if at end
    cleaned = cleaned.replace(/```(?:html|xml)?[\s\S]*$/gi, '');
    // 3. Strip technical source code lead-ins
    cleaned = cleaned.replace(/(?:Dưới đây là|Sau đây là|Here is the|Mã nguồn|Source code)[^\n]*?(?:mã nguồn|source code|code|trang web|HTML)[^\n]*:?/gi, '');
    // 4. Strip system tool messages
    cleaned = cleaned.replace(/`?write_file`?[^\n]*?(?:thành công|hoàn tất|được tạo|delivered|workspace|successful)[^\n]*/gi, '');
    cleaned = cleaned.replace(/\*\(?(?:Mình đã lưu|Đã lưu|File will be delivered|Tôi đã lưu|File saved)[^\n]*\)?\*/gi, '');
    // 5. Strip comment block
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    // 6. Collapse multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    if (!cleaned || !cleaned.trim()) {
      return isVietnamese
        ? 'Tôi đã hoàn thành cập nhật giao diện website theo yêu cầu của bạn. Bạn có thể kiểm tra ngay trên Live Preview hoặc phản hồi để tôi tiếp tục tinh chỉnh nhé!'
        : "I have completed updating the website interface according to your requirements. You can inspect it directly in the Live Preview Canvas or let me know if you would like any further adjustments!";
    }

    return cleaned;
  }

  public extractHtml(fullContent: string, requestStartTime?: number): string {
    const rawText = fullContent || '';

    // =========================================================================
    // ƯU TIÊN 1: NẾU AI ĐÃ THỰC THI TOOL WRITE_FILE ĐỂ SINH/SỬA FILE TRÊN WORKSPACE
    // CHỈ chấp nhận file được tạo/chỉnh sửa TRONG lượt chat này (sau requestStartTime)
    // =========================================================================
    try {
      const workspaceDir =
        env.goclawWorkspaceDir ||
        path.join(os.homedir(), '.goclaw', 'workspace', env.goclawAgentId || 'tho-xay-web-3');

      // 1.1 Kiểm tra xem trong phản hồi có nhắc đến đường dẫn file .html cụ thể nào không
      if (rawText) {
        const pathMatch =
          rawText.match(/([C-Z]:\\[^\s"'\n\r<>*?]+\.html)/i) ||
          rawText.match(/([a-zA-Z0-9_\-./\\]+\.html)/i);
        if (pathMatch) {
          const candidateName = pathMatch[1].replace(/[.,;:)]+$/, '').trim();
          const candidatePaths = [
            candidateName,
            path.join(workspaceDir, candidateName),
            path.join(workspaceDir, path.basename(candidateName)),
          ];
          for (const cPath of candidatePaths) {
            if (fs.existsSync(cPath) && fs.statSync(cPath).isFile()) {
              const stat = fs.statSync(cPath);
              if (!requestStartTime || stat.mtimeMs >= requestStartTime - 2000) {
                const fileContent = fs.readFileSync(cPath, 'utf-8');
                if (fileContent && fileContent.includes('<html')) {
                  return fileContent;
                }
              }
            }
          }
        }
      }

      // 1.2 Quét tìm file .html mới nhất vừa được AI tạo trong thư mục workspace
      let newestHtmlPath = '';
      let newestTime = 0;

      const scanDirectory = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) return;
        try {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isFile() && entry.name.endsWith('.html')) {
              const stat = fs.statSync(fullPath);
              if (stat.mtimeMs > newestTime) {
                newestTime = stat.mtimeMs;
                newestHtmlPath = fullPath;
              }
            } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              scanDirectory(fullPath);
            }
          }
        } catch {
          // Bỏ qua thư mục không có quyền truy cập
        }
      };

      scanDirectory(workspaceDir);

      // CHỈ chấp nhận nếu file thực sự được sửa/ghi trong lượt gọi này (sau requestStartTime - 2000ms bù trừ độ trễ)
      // Tuyệt đối không nhận vơ file cũ từ các lượt chat trước (trong vòng 30 phút)!
      const minAllowedTime = requestStartTime ? requestStartTime - 2000 : Date.now() - 60000;
      if (newestHtmlPath && newestTime >= minAllowedTime) {
        const fileContent = fs.readFileSync(newestHtmlPath, 'utf-8');
        if (fileContent && fileContent.includes('<html')) {
          return fileContent;
        }
      }
    } catch (fsErr) {
      console.warn('[GoClawService] Lỗi khi đọc file .html từ workspace GoClaw:', fsErr);
    }

    // =========================================================================
    // DỰ PHÒNG 2: BÓC TÁCH MÃ HTML TỪ KHỐI MARKDOWN HOẶC RAW TEXT (NẾU CÓ)
    // =========================================================================
    if (rawText) {
      const codeBlockMatch = rawText.match(/```(?:html|xml)?\s*([\s\S]*?)```/i);
      if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].includes('<html')) {
        return codeBlockMatch[1].trim();
      }

      if (rawText.includes('<!DOCTYPE html>') || rawText.includes('<html')) {
        const docStart = rawText.indexOf('<!DOCTYPE html>');
        const htmlStart = rawText.indexOf('<html');
        const startIdx = docStart !== -1 ? docStart : htmlStart;
        const endIdx = rawText.lastIndexOf('</html>');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          return rawText.substring(startIdx, endIdx + 7).trim();
        }
      }
    }

    return '';
  }
}

export const goclawService = new GoClawService();

