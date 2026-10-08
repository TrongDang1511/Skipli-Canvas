import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { goclawConfig } from '../config/goclaw.config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  text: string;
}

export class GoClawService {
  public async chatCompletion(
    prompt: string,
    history: ChatMessage[] = []
  ): Promise<ChatCompletionResponse> {
    const messages: ChatMessage[] = [
      ...history,
      {
        role: 'user',
        content: prompt,
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

      // 1.2 Ưu tiên quét thư mục workspace chuẩn C:\Users\HP\.goclaw\workspace\tho-xay-web-2\tho-xay-web-2
      const searchDirs = [
        'C:\\Users\\HP\\.goclaw\\workspace\\tho-xay-web-2\\tho-xay-web-2',
        'C:\\Users\\HP\\.goclaw\\workspace\\tho-xay-web-2',
        'C:\\Users\\HP\\.goclaw\\workspace',
        process.cwd()
      ];

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

      // Nếu tìm thấy file .html mới nhất vừa được AI tạo/ghi đè trong vòng 10 phút (600,000ms)
      if (newestHtmlPath && Date.now() - newestTime < 600000) {
        const fileContent = fs.readFileSync(newestHtmlPath, 'utf-8');
        if (fileContent && fileContent.includes('<html')) {
          return fileContent;
        }
      }
    } catch (fsErr) {
      console.warn('[GoClawService] Lỗi khi đọc file .html từ ổ cứng:', fsErr);
    }

    // =========================================================================
    // ƯU TIÊN 2: NẾU AI TRẢ VỀ ĐOẠN CODE HTML INLINE (Markdown ```html ... ```)
    // Bóc tách đoạn mã HTML hoàn chỉnh từ phản hồi text nếu không tìm thấy file
    // =========================================================================
    const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
    const match = fullContent.match(htmlBlockRegex);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }

    if (fullContent.includes('<!DOCTYPE') || fullContent.includes('<html') || fullContent.includes('<body')) {
      const startIdx = fullContent.search(/<(?:!DOCTYPE|html|body)/i);
      if (startIdx !== -1) {
        const candidate = fullContent.substring(startIdx).replace(/```\s*$/i, '').trim();
        if (candidate.length > 50) {
          return candidate;
        }
      }
    }

    return '';
  }
}

export const goclawService = new GoClawService();

