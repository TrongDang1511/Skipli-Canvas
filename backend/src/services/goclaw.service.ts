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
  currentHtml?: string;
  sessionTitle?: string;
}

export class GoClawService {
  public async chatCompletion(
    prompt: string,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    const { history = [], currentHtml, sessionTitle } = options;

    let finalPrompt = '';

    if (currentHtml && currentHtml.trim()) {
      // INCREMENTAL EDITING (Turn 2+)
      finalPrompt = `[SKIPLI INCREMENTAL EDIT & UPGRADE DIRECTIVE]:
You are continuing work on an EXISTING single-file website project: "${sessionTitle || 'Website'}".

CURRENT HTML CODE:
\`\`\`html
${currentHtml.trim()}
\`\`\`

USER'S MODIFICATION REQUEST:
${prompt}

MANDATORY 2-STEP WORKFLOW & HARD-STOP RULE:
- Step 1: Execute tool 'write_file' with path="index.html" EXACTLY ONCE to save the updated, complete single-file HTML (>250 lines) to disk. Preserve 100% of all existing sections, style aesthetics, user-uploaded images, copywriting, and Vanilla JS interactivity unless explicitly requested to change.
- Step 2: Do NOT call any more tools (do NOT call write_file again, do NOT call use_skill). Immediately output your conversational response: a warm, insightful summary in natural Vietnamese detailing the exact enhancements made.
- PROHIBITION: Absolutely DO NOT output raw HTML code or \`\`\`html code blocks in your chat response.`;
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
      return 'Tôi đã khởi tạo và xây dựng xong giao diện website theo đúng yêu cầu của bạn. Toàn bộ mã nguồn đã được lưu trữ an toàn trên MinIO Cloud và nạp trực tiếp vào khung Live Preview bên cạnh. Bạn có thể xem thử hoặc dùng chế độ Chỉnh Sửa Trực Quan để đổi chữ, thay ảnh tùy ý!';
    }

    return cleaned;
  }

  public extractHtml(fullContent: string): string {
    const rawText = fullContent || '';

    // =========================================================================
    // ƯU TIÊN 1: NẾU AI ĐÃ SINH FILE .HTML TRÊN Ổ CỨNG / WORKSPACE
    // Đọc trực tiếp 100% nội dung file nguyên bản từ workspace đĩa cứng của agent
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
              const fileContent = fs.readFileSync(cPath, 'utf-8');
              if (fileContent && fileContent.includes('<html')) {
                return fileContent;
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

      // Nếu tìm thấy file .html mới nhất vừa được AI tạo trong vòng 30 phút
      if (newestHtmlPath && Date.now() - newestTime < 1800000) {
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

