import { useState, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat.types';
import { SessionMessage } from '../types/session.types';
import { chatService } from '../services/chat.service';

interface UseChatStreamOptions {
  onTurnComplete?: (sessionId?: string, newHtml?: string) => void;
}

export function useChatStream(options?: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [extractedHtml, setExtractedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadSession = useCallback((sessionMessages: SessionMessage[], html: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setError(null);
    setExtractedHtml(html || '');

    const formatted: ChatMessage[] = sessionMessages.map((m) => {
      const timeStr = m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: m.id,
        sender: m.sender,
        text: m.text,
        time: timeStr,
        version: m.version,
        extractedHtml: m.extractedHtml,
        isLoading: false,
      };
    });

    setMessages(formatted);
    setHasStartedChat(formatted.length > 0);
  }, []);

  const sendPrompt = useCallback(
    async (promptText: string, targetSessionId?: string) => {
      if (!promptText.trim() || isStreaming) return;

      setError(null);
      setHasStartedChat(true);

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now()}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: promptText,
        time: timestamp,
      };

      const versionNum = `v1.${messages.filter((m) => m.sender === 'user').length + 1}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        time: timestamp,
        version: versionNum,
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await chatService.sendChat(
          promptText,
          targetSessionId,
          controller.signal
        );

        setIsStreaming(false);
        const resolvedHtml = result.extractedHtml || chatService.extractHtml(result.fullContent);
        if (resolvedHtml) {
          setExtractedHtml(resolvedHtml);
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: result.fullContent,
                  extractedHtml: resolvedHtml,
                  version: result.version || msg.version,
                  isLoading: false,
                }
              : msg
          )
        );

        if (options?.onTurnComplete) {
          options.onTurnComplete(result.sessionId || targetSessionId, resolvedHtml);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        setIsStreaming(false);
        const errMsg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ AI';

        let friendlyError = errMsg;
        if (
          errMsg.includes('429') ||
          errMsg.includes('rate-limit') ||
          errMsg.includes('rate-limited') ||
          errMsg.includes('failover candidates exhausted') ||
          errMsg.includes('model_not_found')
        ) {
          friendlyError =
            '⚠️ OpenRouter AI Engine đang tạm thời quá tải lượt gọi miễn phí (Rate Limit 429). Hệ thống đang tự động điều hướng, vui lòng thử lại sau 10 - 20 giây!';
        }

        setError(friendlyError);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: friendlyError,
                  isLoading: false,
                }
              : msg
          )
        );
      }
    },
    [isStreaming, messages, options]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? { ...msg, text: '⚠️ Đã dừng xử lý theo yêu cầu người dùng.', isLoading: false }
            : msg
        )
      );
    }
  }, []);

  const resetCanvas = useCallback(() => {
    stopGeneration();
    setHasStartedChat(false);
    setMessages([]);
    setExtractedHtml('');
    setError(null);
  }, [stopGeneration]);

  return {
    messages,
    hasStartedChat,
    isStreaming,
    extractedHtml,
    error,
    sendPrompt,
    stopGeneration,
    resetCanvas,
    loadSession,
  };
}

