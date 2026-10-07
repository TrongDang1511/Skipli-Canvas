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
          tools: [],
          tool_choice: 'none',
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

  public extractHtml(fullContent: string): string {
    if (!fullContent) return '';

    // Trường hợp 1: Nhả ra code HTML trong phản hồi (Markdown ```html ... ``` hoặc <!DOCTYPE html>)
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

    // Trường hợp 2: AI sinh 1 file .html ra ổ cứng (Đọc trực tiếp nội dung file .html)
    try {
      const pathMatch = fullContent.match(/[C-Z]:\\[^\s"'\n\r<>*?]+\.html/i);
      if (pathMatch) {
        const filePath = pathMatch[0].replace(/[.,;:)]+$/, '');
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          return fs.readFileSync(filePath, 'utf-8');
        }
      }

      const systemDir = 'C:\\Users\\HP\\system';
      if (fs.existsSync(systemDir)) {
        const entries = fs.readdirSync(systemDir, { withFileTypes: true });
        let newestHtmlPath = '';
        let newestTime = 0;

        for (const entry of entries) {
          const fullPath = path.join(systemDir, entry.name);
          if (entry.isFile() && entry.name.endsWith('.html')) {
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs > newestTime) {
              newestTime = stat.mtimeMs;
              newestHtmlPath = fullPath;
            }
          } else if (entry.isDirectory()) {
            try {
              const subFiles = fs.readdirSync(fullPath);
              for (const sf of subFiles) {
                if (sf.endsWith('.html')) {
                  const sfPath = path.join(fullPath, sf);
                  const stat = fs.statSync(sfPath);
                  if (stat.mtimeMs > newestTime) {
                    newestTime = stat.mtimeMs;
                    newestHtmlPath = sfPath;
                  }
                }
              }
            } catch {
              // Ignore unreadable subfolders
            }
          }
        }

        if (newestHtmlPath && Date.now() - newestTime < 600000) {
          return fs.readFileSync(newestHtmlPath, 'utf-8');
        }
      }
    } catch {
      // Ignore filesystem read errors
    }

    return '';
  }
}

export const goclawService = new GoClawService();

