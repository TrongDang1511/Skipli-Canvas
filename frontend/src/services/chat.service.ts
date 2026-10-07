import { ChatApiResponse } from '../types/chat.types';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ChatService {
  public async sendChat(
    prompt: string,
    sessionId?: string,
    signal?: AbortSignal,
    isRetryAfterRefresh = false
  ): Promise<ChatApiResponse['data']> {
    const token = localStorage.getItem('skipli_access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, sessionId }),
        signal,
      });

      if (response.status === 401 && !isRetryAfterRefresh) {
        const refreshToken = localStorage.getItem('skipli_refresh_token');
        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
            const newAccessToken = refreshRes.data?.data?.accessToken;
            const newRefreshToken = refreshRes.data?.data?.refreshToken;

            if (newAccessToken && newRefreshToken) {
              localStorage.setItem('skipli_access_token', newAccessToken);
              localStorage.setItem('skipli_refresh_token', newRefreshToken);
              return this.sendChat(prompt, sessionId, signal, true);
            }
          } catch {
            localStorage.removeItem('skipli_access_token');
            localStorage.removeItem('skipli_refresh_token');
            window.location.reload();
            throw new Error('Phiên làm việc hết hạn.');
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.message ||
          errorData?.error ||
          `Máy chủ phản hồi lỗi: ${response.status} ${response.statusText}`;
        throw new Error(message);
      }

      const result = (await response.json()) as ChatApiResponse;
      return result.data;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : 'Lỗi kết nối máy chủ AI';
      throw new Error(errMsg);
    }
  }

  public extractHtml(content: string): string {
    if (!content) return '';

    const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
    const match = content.match(htmlBlockRegex);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }

    if (content.includes('<!DOCTYPE') || content.includes('<html') || content.includes('<body')) {
      const startIdx = content.search(/<(?:!DOCTYPE|html|body)/i);
      if (startIdx !== -1) {
        return content.substring(startIdx).replace(/```\s*$/i, '').trim();
      }
    }

    return '';
  }

  public formatChatDisplay(content: string, version?: string, isLoading?: boolean): string {
    if (isLoading) {
      return '';
    }

    if (!content) {
      return `✨ Đã xây dựng và cập nhật thành công giao diện ${version || 'mới'} trên Live Preview Canvas.`;
    }

    if (
      content.includes("Agent couldn't generate a response") ||
      content.includes('failover candidates exhausted') ||
      content.includes('rate_limit')
    ) {
      return '⚠️ AI Engine tạm thời gián đoạn ở lượt này do OpenRouter bị nghẽn mạng. Vui lòng bấm "Tạo Web" hoặc gửi lại câu lệnh để AI tiếp tục cập nhật giao diện!';
    }

    let textOnly = content.replace(/```[a-z]*[\s\S]*?```/gi, '');
    textOnly = textOnly.replace(/```[a-z]*[\s\S]*/gi, '');

    const firstHtmlTagIndex = textOnly.search(/<(?:!DOCTYPE|html|body|div|header|section|main|nav|footer|style|script|svg|form|table|h1|h2|h3|p|ul|ol|li|article|aside|details)/i);
    if (firstHtmlTagIndex !== -1) {
      textOnly = textOnly.substring(0, firstHtmlTagIndex).trim();
    }

    textOnly = textOnly.replace(/<[^>]*>?/gm, '').trim();

    const isCodeLabelArtifact = /^(html|css|js|javascript|json|markdown|xml|code|mã\s*nguồn)[:\s]*$/i.test(textOnly.trim());

    if (!textOnly || textOnly.length < 5 || isCodeLabelArtifact) {
      return `✨ Đã xây dựng và cập nhật thành công giao diện ${version || 'mới'} trên Live Preview Canvas.`;
    }

    return textOnly;
  }
}

export const chatService = new ChatService();

