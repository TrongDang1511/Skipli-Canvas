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
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [extractedHtml, setExtractedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentContentRef = useRef('');

  const loadSession = useCallback((sessionMessages: SessionMessage[], html: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingContent('');
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
        thinkingContent: m.thinkingContent,
        isStreaming: false,
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
        isStreaming: true,
        thinkingContent: '',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);
      setStreamingContent('');
      currentContentRef.current = '';

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await chatService.streamChat(
        promptText,
        {
          onToken: (token: string) => {
            currentContentRef.current += token;
            const updatedContent = currentContentRef.current;
            setStreamingContent(updatedContent);

            const thinking = chatService.extractThinking(updatedContent);
            const html = chatService.extractHtml(updatedContent);

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      text: updatedContent,
                      thinkingContent: thinking,
                    }
                  : msg
              )
            );

            if (html && !isStreaming) {
              setExtractedHtml(html);
            }
          },
          onComplete: (fullContent: string, finalHtml: string, returnedSessionId?: string, returnedVersion?: string) => {
            setIsStreaming(false);
            const resolvedHtml = finalHtml || chatService.extractHtml(fullContent);
            const thinking = chatService.extractThinking(fullContent);

            if (resolvedHtml) {
              setExtractedHtml(resolvedHtml);
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      text: fullContent,
                      thinkingContent: thinking,
                      extractedHtml: resolvedHtml,
                      version: returnedVersion || msg.version,
                      isStreaming: false,
                    }
                  : msg
              )
            );

            if (options?.onTurnComplete) {
              options.onTurnComplete(returnedSessionId || targetSessionId, resolvedHtml);
            }
          },
          onError: (errMsg: string) => {
            setIsStreaming(false);

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
                      isStreaming: false,
                    }
                  : msg
              )
            );
          },
        },
        targetSessionId,
        controller.signal
      );
    },
    [isStreaming, messages, options]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming
            ? { ...msg, text: msg.text + ' [Đã dừng sinh mã]', isStreaming: false }
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
    setStreamingContent('');
    setError(null);
  }, [stopGeneration]);

  return {
    messages,
    hasStartedChat,
    isStreaming,
    streamingContent,
    extractedHtml,
    error,
    sendPrompt,
    stopGeneration,
    resetCanvas,
    loadSession,
  };
}
