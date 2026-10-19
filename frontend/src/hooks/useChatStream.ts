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
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadSession = useCallback((sessionMessages: SessionMessage[], html: string, url?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setError(null);
    setExtractedHtml(html || '');
    setPresignedUrl(url || '');

    let lastSeenVersion = 'v1.1';
    const formatted: ChatMessage[] = sessionMessages.map((m) => {
      if (m.version) {
        lastSeenVersion = m.version.replace(/\s*\([^)]*\)/g, '').trim();
      }
      const timeStr = m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: m.id,
        sender: m.sender,
        text: m.text,
        time: timeStr,
        version: m.version || (m.sender === 'ai' ? lastSeenVersion : undefined),
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

      // Lấy phiên bản hiện tại từ tin nhắn gần nhất có version hoặc mặc định 'v1.1'
      const lastVersionMsg = [...messages].reverse().find((m) => m.version);
      const currentVersion = lastVersionMsg?.version?.replace(/\s*\([^)]*\)/g, '').trim() || 'v1.1';

      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        time: timestamp,
        version: currentVersion,
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

        // Nguồn chân lý duy nhất (Single Source of Truth): Chỉ tin MinIO S3
        let minioHtml = '';
        if (result.presignedUrl) {
          setPresignedUrl(result.presignedUrl);
          try {
            const res = await fetch(result.presignedUrl, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
              if (!text.includes('<Error>') || !text.includes('<Code>NoSuchKey</Code>')) {
                minioHtml = text;
                setExtractedHtml(text);
              }
            }
          } catch (fetchErr) {
            console.warn('[useChatStream] Lỗi khi kéo file HTML từ MinIO presignedUrl:', fetchErr);
          }
        }

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === userMsgId && result.userMessageId) {
              return { ...msg, id: result.userMessageId };
            }
            if (msg.id === aiMsgId) {
              return {
                ...msg,
                id: result.aiMessageId || msg.id,
                text: result.fullContent,
                extractedHtml: minioHtml,
                version: result.version || msg.version || currentVersion,
                isLoading: false,
              };
            }
            return msg;
          })
        );

        if (options?.onTurnComplete) {
          options.onTurnComplete(result.sessionId || targetSessionId, minioHtml);
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
    setPresignedUrl('');
    setError(null);
  }, [stopGeneration]);

  const applyRollback = useCallback(
    (
      cutoffMessageId: string,
      restoredHtml: string | null,
      newPresignedUrl: string | null,
      keepTargetMessage = false
    ) => {
      setMessages((prev) => {
        const targetIndex = prev.findIndex((m) => m.id === cutoffMessageId);
        if (targetIndex === -1) return prev;
        return keepTargetMessage ? prev.slice(0, targetIndex + 1) : prev.slice(0, targetIndex);
      });

      if (restoredHtml) {
        setExtractedHtml(restoredHtml);
        setPresignedUrl(newPresignedUrl || '');
        setHasStartedChat(true);
      } else {
        setExtractedHtml('');
        setPresignedUrl('');
        setHasStartedChat(false);
      }
    },
    []
  );

  return {
    messages,
    hasStartedChat,
    isStreaming,
    extractedHtml,
    presignedUrl,
    error,
    sendPrompt,
    stopGeneration,
    resetCanvas,
    loadSession,
    updateExtractedHtml: setExtractedHtml,
    applyRollback,
  };
}

