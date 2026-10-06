import { SSEEvent } from '../types/chat.types';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface StreamChatCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullContent: string, extractedHtml: string, sessionId?: string, version?: string) => void;
  onError: (errorMessage: string) => void;
}

export class ChatService {
  public async streamChat(
    prompt: string,
    callbacks: StreamChatCallbacks,
    sessionId?: string,
    signal?: AbortSignal,
    isRetryAfterRefresh = false
  ): Promise<void> {
    const token = localStorage.getItem('skipli_access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
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
              return this.streamChat(prompt, callbacks, sessionId, signal, true);
            }
          } catch {
            localStorage.removeItem('skipli_access_token');
            localStorage.removeItem('skipli_refresh_token');
            window.location.reload();
            return;
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.message ||
          errorData?.error ||
          `Máy chủ phản hồi lỗi: ${response.status} ${response.statusText}`;
        callbacks.onError(message);
        return;
      }

      if (!response.body) {
        callbacks.onError('Không nhận được luồng dữ liệu từ máy chủ.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') continue;

          try {
            const event = JSON.parse(dataStr) as SSEEvent;
            if (event.type === 'token') {
              callbacks.onToken(event.token);
            } else if (event.type === 'complete') {
              callbacks.onComplete(event.fullContent, event.extractedHtml, event.sessionId, event.version);
            } else if (event.type === 'error') {
              callbacks.onError(event.error);
            }
          } catch {
            // ignore non-json frames
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const errMsg = error instanceof Error ? error.message : 'Lỗi kết nối stream';
      callbacks.onError(errMsg);
    }
  }

  public extractThinking(content: string): string {
    if (!content) return '';
    const match = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return '';
  }

  public extractHtml(content: string): string {
    if (!content) return '';

    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');

    const completeMatch = cleaned.match(/```html\s*([\s\S]*?)\s*```/i);
    if (completeMatch && completeMatch[1]) {
      return completeMatch[1].trim();
    }

    const partialMatch = cleaned.match(/```html\s*([\s\S]*)/i);
    if (partialMatch && partialMatch[1]) {
      return partialMatch[1].replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    if (cleaned.includes('<!DOCTYPE') || cleaned.includes('<html') || cleaned.includes('<body') || cleaned.includes('<div')) {
      const startIdx = cleaned.search(/<(?:!DOCTYPE|html|body|div)/i);
      if (startIdx !== -1) {
        return cleaned.substring(startIdx).replace(/```\s*$/i, '').trim();
      }
      return cleaned.trim();
    }

    return '';
  }

  public formatChatDisplay(content: string, version?: string, isStreaming?: boolean): string {
    if (!content) {
      return isStreaming ? 'Đang phân tích và xử lý giao diện...' : '';
    }

    if (
      content.includes("Agent couldn't generate a response") ||
      content.includes('failover candidates exhausted') ||
      content.includes('rate_limit')
    ) {
      return '⚠️ AI Engine tạm thời gián đoạn ở lượt này do OpenRouter bị nghẽn mạng. Vui lòng bấm "Tạo Web" hoặc gửi lại câu lệnh để AI tiếp tục cập nhật giao diện!';
    }

    let textOnly = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    textOnly = textOnly.replace(/<think>[\s\S]*/gi, '');

    const hasHtmlCode = /```html|<!DOCTYPE|<html|<body/i.test(textOnly);
    if (hasHtmlCode) {
      return `✨ Đã xây dựng và cập nhật thành công giao diện ${version || 'mới'} trên Live Preview Canvas.`;
    }

    textOnly = textOnly.replace(/```[a-z]*[\s\S]*?```/gi, '');
    textOnly = textOnly.replace(/```[a-z]*[\s\S]*/gi, '');

    const firstHtmlTagIndex = textOnly.search(/<(?:!DOCTYPE|html|body|div|header|section|main|nav|footer|style|script|svg|form|table|h1|h2|h3|p|ul|ol|li|article|aside|details)/i);
    if (firstHtmlTagIndex !== -1) {
      textOnly = textOnly.substring(0, firstHtmlTagIndex).trim();
    }

    textOnly = textOnly.replace(/<[^>]*>?/gm, '').trim();

    const isCodeLabelArtifact = /^(html|css|js|javascript|json|markdown|xml|code|mã\s*nguồn)[:\s]*$/i.test(textOnly.trim());

    if (!textOnly || textOnly.length < 5 || isCodeLabelArtifact) {
      if (isStreaming) {
        return '⚡ Đang suy nghĩ và thiết kế giao diện...';
      }
      return `✨ Đã xây dựng và cập nhật thành công giao diện ${version || 'mới'} trên Live Preview Canvas.`;
    }

    return textOnly;
  }
}

export const chatService = new ChatService();
