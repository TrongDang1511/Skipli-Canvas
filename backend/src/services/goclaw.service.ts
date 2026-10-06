import axios from 'axios';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { goclawConfig } from '../config/goclaw.config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GoClawService {
  public async streamChatCompletion(
    prompt: string,
    history: ChatMessage[] = []
  ): Promise<Readable> {
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
          stream: true,
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
          responseType: 'stream',
          timeout: 0,
        }
      );

      return response.data as Readable;
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

    let cleaned = fullContent.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');

    const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
    const match = cleaned.match(htmlBlockRegex);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }

    if (cleaned.includes('<!DOCTYPE') || cleaned.includes('<html') || cleaned.includes('<body') || cleaned.includes('<div')) {
      const startIdx = cleaned.search(/<(?:!DOCTYPE|html|body|div)/i);
      if (startIdx !== -1) {
        const candidate = cleaned.substring(startIdx).replace(/```\s*$/i, '').trim();
        if (candidate.length > 50) {
          return candidate;
        }
      }
    }

    try {
      const systemDir = 'C:\\Users\\HP\\system';

      const pathMatch = fullContent.match(/[C-Z]:\\[^\s"'\n\r<>*?]+/i);
      if (pathMatch) {
        const matchedPath = pathMatch[0].replace(/[.,;:)]+$/, '');
        if (fs.existsSync(matchedPath)) {
          const stat = fs.statSync(matchedPath);
          if (stat.isDirectory()) {
            const indexPath = path.join(matchedPath, 'index.html');
            if (fs.existsSync(indexPath)) {
              return this.bundleHtmlFile(indexPath);
            }
          } else if (stat.isFile() && matchedPath.endsWith('.html')) {
            return this.bundleHtmlFile(matchedPath);
          }
        }
      }

      if (fs.existsSync(systemDir)) {
        const entries = fs.readdirSync(systemDir, { withFileTypes: true });
        let newestHtml = '';
        let newestTime = 0;

        for (const entry of entries) {
          const fullPath = path.join(systemDir, entry.name);
          if (entry.isDirectory()) {
            try {
              const files = fs.readdirSync(fullPath);
              for (const f of files) {
                if (f.endsWith('.html')) {
                  const htmlFilePath = path.join(fullPath, f);
                  const stat = fs.statSync(htmlFilePath);
                  if (stat.mtimeMs > newestTime) {
                    newestTime = stat.mtimeMs;
                    newestHtml = htmlFilePath;
                  }
                }
              }
            } catch {
              // skip unreadable folder
            }
          } else if (entry.name.endsWith('.html')) {
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs > newestTime) {
              newestTime = stat.mtimeMs;
              newestHtml = fullPath;
            }
          }
        }

        if (newestHtml && Date.now() - newestTime < 600000) {
          return this.bundleHtmlFile(newestHtml);
        }
      }
    } catch {
      // ignore filesystem scan errors
    }

    return '';
  }

  private bundleHtmlFile(htmlFilePath: string): string {
    try {
      let content = fs.readFileSync(htmlFilePath, 'utf-8');
      const folder = path.dirname(htmlFilePath);

      content = content.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
        if (!href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
          const cleanHref = href.split('?')[0];
          const cssPath = path.join(folder, cleanHref);
          if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf-8');
            return `<style>\n${cssContent}\n</style>`;
          }
        }
        return match;
      });

      content = content.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
        if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
          const cleanSrc = src.split('?')[0];
          const jsPath = path.join(folder, cleanSrc);
          if (fs.existsSync(jsPath)) {
            const jsContent = fs.readFileSync(jsPath, 'utf-8');
            return `<script>\n${jsContent}\n</script>`;
          }
        }
        return match;
      });

      return content;
    } catch {
      return '';
    }
  }
}

export const goclawService = new GoClawService();
