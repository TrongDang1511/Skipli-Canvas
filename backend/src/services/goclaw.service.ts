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

MANDATORY RULES:
1. Carefully update and enhance the EXISTING HTML source code above according to the user's new request.
2. PRESERVE 100% of all existing 8 sections, style aesthetics, Unsplash images, copywriting, and Vanilla JS interactivity unless explicitly requested to remove or change them.
3. Write the updated, complete single-file HTML (>250 lines) directly to disk in the current workspace directory via tool call 'write_file'.
4. CRITICAL OUTPUT RESTRICTION: Do NOT output or print the raw HTML code (or any \`\`\`html code blocks) in your conversational chat response text. You MUST ONLY save the file directly to disk using tool 'write_file'. In your chat response, provide ONLY a concise, polite summary in Vietnamese detailing the exact enhancements made.`;
    } else {
      // INITIAL CREATION (Turn 1)
      finalPrompt = `[SKIPLI MASTER DESIGN & ARCHITECTURE DIRECTIVE]:
You MUST strictly follow all 4 active Skipli Skills:
1. 'skipli-adaptive-design-systems': Apply industry-matched color palettes, Google Fonts (Outfit / Playfair Display / Plus Jakarta Sans), Tailwind CSS CDN, and Lucide Icons CDN.
2. 'skipli-copywriting-seo': High-converting headlines, outcome-oriented CTAs, social proof, single H1, and SEO meta tags.
3. 'skipli-ecommerce-interactivity': MUST execute tool 'write_file' with path="[brand_slug]_[timestamp].html" in the current working directory to generate a single-file HTML (>250 lines) containing ALL 8 MANDATORY SECTIONS:
   - Section 1: Sticky Glassmorphism Header & Navbar with floating Cart Icon & item count badge.
   - Section 2: High-Impact Hero Banner with dual CTAs, trust rating pill (4.9/5★), and featured dish/product badge.
   - Section 3: Brand Story / Artisan Quality Bento Grid with 3 metric highlight cards.
   - Section 4: Categorized Product Grid with Category Tab Filters ("All", "Signatures", "Side Dishes", "Beverages"), real price tags, Quick View, and Add to Cart.
   - Section 5: Value Proposition / Key Features Grid with Lucide stroke icons.
   - Section 6: Customer Testimonials with 5-star gold ratings & authentic portrait avatars.
   - Section 7: Interactive Reservation / Order Form with submit Toast notification & Map Card.
   - Section 8: Luxury 4-Column Footer & Slide-Over Cart Drawer with 100% Vanilla JS interactivity (Cart state, quantity adjustment, subtotal calculation, checkout simulation).
4. 'skipli-media-sourcing': Use unique, high-resolution Unsplash photo URLs for EVERY single item card and avatar. Never reuse the exact same photo ID across cards.

CRITICAL OUTPUT RESTRICTION: Do NOT output or print the raw HTML code (or any \`\`\`html code blocks) in your conversational chat response text. You MUST ONLY create and save the complete HTML file directly to disk in the current workspace directory using tool 'write_file'. In your chat response, provide ONLY a concise, polite summary in Vietnamese explaining the key design highlights and features created.

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
    if (!rawText) return '';
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

    return cleaned || rawText;
  }

  public extractHtml(fullContent: string): string {
    if (!fullContent) return '';

    // =========================================================================
    // ƯU TIÊN 1: NẾU AI ĐÃ SINH FILE .HTML TRÊN Ổ CỨNG / WORKSPACE
    // Đọc trực tiếp 100% nội dung file nguyên bản từ workspace đĩa cứng của agent
    // =========================================================================
    try {
      // 1.1 Kiểm tra xem trong phản hồi có nhắc đến đường dẫn file .html cụ thể nào không
      const pathMatch = fullContent.match(/([C-Z]:\\[^\s"'\n\r<>*?]+\.html)/i) ||
                        fullContent.match(/([a-zA-Z0-9_\-./\\]+\.html)/i);
      if (pathMatch) {
        const candidatePath = pathMatch[1].replace(/[.,;:)]+$/, '').trim();
        if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
          const fileContent = fs.readFileSync(candidatePath, 'utf-8');
          if (fileContent && fileContent.includes('<html')) {
            return fileContent;
          }
        }
      }

      // 1.2 Ưu tiên quét thư mục workspace chuẩn của GoClaw Agent (Đường dẫn động theo OS & Config)
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

      // Quét tìm file .html mới nhất vừa được AI tạo trong thư mục workspace
      for (const dir of searchDirs) {
        scanDirectory(dir);
      }

      // Nếu tìm thấy file .html mới nhất vừa được AI tạo trong vòng 15 phút
      if (newestHtmlPath && Date.now() - newestTime < 900000) {
        const fileContent = fs.readFileSync(newestHtmlPath, 'utf-8');
        if (fileContent && fileContent.includes('<html')) {
          return fileContent;
        }
      }
    } catch (fsErr) {
      console.warn('[GoClawService] Lỗi khi đọc file .html từ workspace GoClaw:', fsErr);
    }

    return '';
  }
}

export const goclawService = new GoClawService();

