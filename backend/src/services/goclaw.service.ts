import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { env } from '../config/env.config';
import { goclawConfig } from '../config/goclaw.config';
import { maskHtmlAssets } from '../utils/asset-masker.utils';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  text: string;
  assetMap?: Map<string, string>;
}

export interface ChatCompletionOptions {
  history?: ChatMessage[];
  currentHtml?: string;
  codeUrl?: string;
  sessionTitle?: string;
}

export class GoClawService {
  public async chatCompletion(
    prompt: string,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    const { history = [], currentHtml, codeUrl, sessionTitle } = options;

    let finalPrompt = '';
    let assetMap: Map<string, string> | undefined;

    const historyBlock =
      history && history.length > 0
        ? `\n\n[LỊCH SỬ ĐOẠN CHAT GẦN NHẤT (10 TIN NHẮN)]:\n` +
          history
            .map((msg) => `${msg.role === 'user' ? 'Người dùng' : 'AI Assistant'}: ${msg.content}`)
            .join('\n\n')
        : '';

    if (codeUrl && codeUrl.trim()) {
      // =========================================================================
      // HTTP ON-DEMAND URL CONTEXT + EMBEDDED CONVERSATION HISTORY
      // Giải quyết triệt để vấn đề GoClaw stateless + MinIO URL 200 OK
      // =========================================================================
      finalPrompt = `[SKIPLI AI ADAPTIVE ARCHITECT DIRECTIVE]:
Bạn là Kiến trúc sư UI/UX kiêm Kỹ sư Frontend chịu trách nhiệm phát triển và tinh chỉnh website cho người dùng.

[LIÊN KẾT MÃ NGUỒN WEBSITE HIỆN TẠI]:
Toàn bộ mã nguồn HTML hiện tại của website đang được lưu trữ tại liên kết sau:
${codeUrl}
${historyBlock}

[YÊU CẦU HIỆN TẠI CỦA NGƯỜI DÙNG]:
"${prompt}"

[HƯỚNG DẪN QUY TRÌNH THỰC THI BẮT BUỘC]:
1. TRƯỜNG HỢP NGƯỜI DÙNG HỎI Ý KIẾN / TƯ VẤN / TRAO ĐỔI (Không yêu cầu cập nhật code):
   - Bạn có thể gọi tool 'web_fetch' với url="${codeUrl}" nếu cần đọc qua mã nguồn hiện tại để tư vấn chính xác, hoặc dựa vào lịch sử đoạn chat để trả lời.
   - Tuyệt đối KHÔNG gọi tool 'write_file'.
   - Trả lời bằng tiếng Việt tự nhiên, ấm áp, sâu sắc và chuyên nghiệp.

2. TRƯỜNG HỢP NGƯỜI DÙNG YÊU CẦU CHỈNH SỬA / ĐỔI MÀU / THAY ĐỔI GIAO DIỆN / CẬP NHẬT CODE:
   - Bước 1 (Đọc mã gốc): Gọi tool 'web_fetch' với url="${codeUrl}" và extractMode="text" để tải về 100% mã nguồn HTML hiện tại của website.
   - Bước 2 (Viết code mới): Dựa trên mã nguồn gốc vừa lấy được từ 'web_fetch', thực hiện thay đổi theo đúng yêu cầu của người dùng. BẮT BUỘC giữ nguyên toàn bộ các phần, thẻ script, phong cách và cấu trúc website hiện có.
   - Bước 3 (Lưu code): Gọi tool 'write_file' với path="index.html" ĐÚNG 1 LẦN DUY NHẤT để ghi đè toàn bộ mã HTML mới hoàn chỉnh (>250 dòng).
   - Bước 4 (Dừng lại & Báo cáo): Sau khi gọi 'write_file', KHÔNG gọi thêm bất kỳ công cụ nào khác. Trả lời tóm tắt bằng tiếng Việt giải thích những điểm vừa cập nhật.

[ĐIỀU CẤM TUYỆT ĐỐI]:
- Tuyệt đối KHÔNG xuất mã nguồn HTML thô hoặc khối code \`\`\`html trong lời chat trò chuyện.`;
    } else if (currentHtml && currentHtml.trim()) {
      // 1. Kỹ thuật Token Masking: Thay thế toàn bộ link ảnh MinIO S3 & CDN bằng token ngắn
      const maskedResult = maskHtmlAssets(currentHtml.trim());
      const maskedHtml = maskedResult.maskedHtml;
      assetMap = maskedResult.assetMap;

      // INCREMENTAL EDITING (Turn 2+) - Adaptive Dual-Mode Directive in English
      finalPrompt = `[SKIPLI ADAPTIVE ASSISTANT & EDIT DIRECTIVE]:
You are an expert Frontend Architect & UI/UX Consultant working on an EXISTING single-file website project: "${sessionTitle || 'Website'}".

CURRENT HTML CONTEXT:
\`\`\`html
${maskedHtml}
\`\`\`
${historyBlock}

USER'S MESSAGE:
"${prompt}"

CRITICAL DUAL-MODE INTENT EVALUATION & EXECUTION RULES:

Mode 1: CONVERSATIONAL, ADVISORY, OR INQUIRY INTENT
- If the user's message is asking for ideas, suggestions, critique, recommendations, explanations, feature listings, or general questions WITHOUT an explicit command to update the website code (e.g., "liệt kê những thứ hay ho bạn nghĩ hệ thống nên có", "gợi ý tính năng", "giải thích code", "website này có tốt không?"):
  * STRICTLY FORBIDDEN: Do NOT call 'write_file' or ANY other tools.
  * Do NOT touch or overwrite the HTML file.
  * Provide a warm, insightful, structured, and comprehensive response directly in natural Vietnamese.

Mode 2: EXPLICIT CODE / UI / DESIGN MODIFICATION INTENT
- If the user explicitly asks to modify, add, delete, restyle, or change content/sections in the website (e.g., "đổi màu nền...", "thêm mục...", "sửa chữ...", "áp dụng các gợi ý trên vào web"):
  * Rule 1 (Asset Immutability): You MUST preserve all '__SKIPLI_ASSET_X__' tokens EXACTLY verbatim inside their respective <img> src or CSS background-image attributes. Never remove or change them.
  * Rule 2 (Tool Invocation): Call the tool 'write_file' with path="index.html" EXACTLY ONCE to save the complete updated single-file HTML (>250 lines) to disk.
  * Rule 3 (Hard-Stop): After calling 'write_file' once, DO NOT call any further tools. Output your friendly summary in Vietnamese explaining the enhancements made.

GENERAL PROHIBITION:
- Absolutely DO NOT output raw HTML code or \`\`\`html code blocks in your conversational chat reply.`;
    } else {
      // INITIAL CREATION (Turn 1)
      finalPrompt = `[SKIPLI MASTER DESIGN & ARCHITECTURE DIRECTIVE]:
You are an elite Digital UI/UX Architect. Design and construct a high-converting, single-file HTML website with:
1. Light & Luxurious aesthetic: Warm White background (#FAF9F6), Deep Navy (#0B192C), Metallic Gold (#D4AF37), Google Fonts (Outfit / Plus Jakarta Sans), Tailwind CSS CDN, and Lucide Icons CDN.
2. High-converting copywriting: Single H1, outcome-oriented CTAs, trust rating (4.9/5★), and SEO meta tags.
3. All 8 comprehensive sections:
   - Sticky Glassmorphism Header & Navbar with floating Cart Icon & badge.
   - High-Impact Hero Banner with dual CTAs and trust rating pill.
   - Brand Story Bento Grid with 3 metric highlight cards.
   - Categorized Product Grid with Category Tab Filters ("All", "Signatures", "Side Dishes", "Beverages"), real prices, and Add to Cart.
   - Value Proposition / Key Features Grid with Lucide stroke icons.
   - Customer Testimonials with 5-star gold ratings & portrait avatars.
   - Interactive Reservation / Order Form with submit Toast notification.
   - 4-Column Luxury Footer & Slide-Over Cart Drawer with 100% Vanilla JS interactivity.
4. Clean SVG Data URI placeholders or unique high-resolution Unsplash photo URLs for all cards.

MANDATORY 2-STEP WORKFLOW & HARD-STOP RULE:
- Step 1: Execute tool 'write_file' with path="index.html" EXACTLY ONCE to save the complete single-file HTML (>250 lines) to disk.
- Step 2: Do NOT call any more tools (do NOT call write_file again, do NOT call use_skill). Immediately output your conversational response: a warm, insightful summary in natural Vietnamese explaining what you designed and built, and suggesting next steps for the user.
- PROHIBITION: Absolutely DO NOT output raw HTML code or \`\`\`html code blocks in your chat response.

User Request: ${prompt}`;
    }

    const messages: ChatMessage[] = [
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
          max_tokens: 8192,
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

      return { text: content, assetMap };
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

  public cleanTextResponse(rawText: string): string {
    if (!rawText || !rawText.trim()) {
      return 'Tôi đã khởi tạo và xây dựng xong giao diện website theo đúng yêu cầu của bạn. Toàn bộ mã nguồn đã được lưu trữ an toàn trên MinIO Cloud và nạp trực tiếp vào khung Live Preview bên cạnh. Bạn có thể xem thử hoặc dùng chế độ Chỉnh Sửa Trực Quan để đổi chữ, thay ảnh tùy ý!';
    }
    let cleaned = rawText;

    // 1. Loại bỏ toàn bộ các khối mã ```html ... ``` hoặc ``` ... ```
    cleaned = cleaned.replace(/```(?:html|xml|css|javascript|js)?[\s\S]*?```/gi, '');
    // 2. Loại bỏ khối mã chưa đóng nếu có ở cuối
    cleaned = cleaned.replace(/```(?:html|xml)?[\s\S]*$/gi, '');
    // 3. Loại bỏ các câu dẫn mã nguồn kỹ thuật (VD: "Dưới đây là mã nguồn hoàn chỉnh...")
    cleaned = cleaned.replace(/(?:Dưới đây là|Sau đây là|Here is the|Mã nguồn|Source code)[^\n]*?(?:mã nguồn|source code|code|trang web|HTML)[^\n]*:?/gi, '');
    // 4. Loại bỏ các dòng thông báo tool hệ thống (VD: `write_file` đã được thực thi thành công...)
    cleaned = cleaned.replace(/`?write_file`?[^\n]*?(?:thành công|hoàn tất|được tạo|delivered|workspace)[^\n]*/gi, '');
    cleaned = cleaned.replace(/\*\(?(?:Mình đã lưu|Đã lưu|File will be delivered|Tôi đã lưu)[^\n]*\)?\*/gi, '');
    // 5. Loại bỏ comment block
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    // 6. Xóa các dòng trống liên tiếp
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    if (!cleaned || !cleaned.trim()) {
      return 'Tôi đã ghi nhận ý kiến của bạn. Nếu bạn muốn áp dụng các ý tưởng hoặc thay đổi này vào giao diện website, hãy cho tôi biết nhé!';
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
      const userHome = os.homedir();
      const agentId = env.goclawAgentId;
      const customWorkspace = env.goclawWorkspaceDir;

      const searchDirs = [
        customWorkspace,
        agentId ? path.join(userHome, '.goclaw', 'workspace', agentId, agentId) : '',
        agentId ? path.join(userHome, '.goclaw', 'workspace', agentId) : '',
        path.join(userHome, '.goclaw', 'workspace'),
        process.cwd()
      ].filter((dir): dir is string => Boolean(dir && dir.trim()));

      // 1.1 Kiểm tra xem trong phản hồi có nhắc đến đường dẫn file .html cụ thể nào không
      if (rawText) {
        const pathMatch = rawText.match(/([C-Z]:\\[^\s"'\n\r<>*?]+\.html)/i) ||
                          rawText.match(/([a-zA-Z0-9_\-./\\]+\.html)/i);
        if (pathMatch) {
          const candidateName = pathMatch[1].replace(/[.,;:)]+$/, '').trim();
          const candidatePaths = [
            candidateName,
            ...searchDirs.map((dir) => path.join(dir, candidateName)),
            ...searchDirs.map((dir) => path.join(dir, path.basename(candidateName))),
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

      for (const dir of searchDirs) {
        scanDirectory(dir);
      }

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

