import { useState, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat.types';
import { chatService } from '../services/chat.service';

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [extractedHtml, setExtractedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentContentRef = useRef('');

  const sendPrompt = useCallback(
    async (promptText: string) => {
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
          onComplete: (fullContent: string, finalHtml: string) => {
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
                      isStreaming: false,
                    }
                  : msg
              )
            );
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
        controller.signal
      );
    },
    [isStreaming, messages]
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
  };
}
