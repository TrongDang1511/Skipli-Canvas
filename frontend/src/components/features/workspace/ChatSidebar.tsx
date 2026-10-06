import { FC, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChatMessage } from '../../../types/chat.types';
import { chatService } from '../../../services/chat.service';
import { cn } from '../../../utils/cn';
import {
  Sparkles,
  Send,
  Square,
  Wand2,
  Layers,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ChatSidebarProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendPrompt: (prompt: string) => void;
  onStopGeneration: () => void;
}

export const ChatSidebar: FC<ChatSidebarProps> = ({
  messages,
  isStreaming,
  onSendPrompt,
  onStopGeneration,
}) => {
  const [inputText, setInputText] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const thinkingScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (thinkingScrollRef.current) {
      thinkingScrollRef.current.scrollTop = thinkingScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    onSendPrompt(inputText);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const formatThinkingPreview = (thinkingText?: string) => {
    if (!thinkingText) return 'Đang xử lý luồng suy luận...';
    const trimmed = thinkingText.trim();
    if (trimmed.length <= 300) {
      return trimmed;
    }
    return `... ${trimmed.slice(-300)}`;
  };

  return (
    <aside className="w-[400px] max-w-[400px] bg-[#0B192C] border-r border-slate-800 text-stone-100 flex flex-col h-full shrink-0 select-none shadow-xl z-20">
      <div className="h-12 px-4 border-b border-slate-800/80 flex items-center justify-between text-xs font-semibold text-stone-300 bg-[#070F1E]/80">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Lịch Sử Tương Tác & Lệnh Prompt</span>
        </div>
        <span className="text-[10px] text-stone-400 bg-slate-800/60 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
          {messages.length} bước
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div key={msg.id} className="space-y-2">
              {!isAi && (
                <div className="flex justify-end">
                  <div className="max-w-[88%] bg-[#1E3E62] text-white p-3 rounded-2xl rounded-tr-xs shadow-md border border-slate-700/60">
                    <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>
                    <span className="text-[10px] text-stone-400 mt-1 block text-right">
                      {msg.time}
                    </span>
                  </div>
                </div>
              )}

              {isAi && (
                <div className="space-y-2">
                  <div className="bg-[#0e1e36] border border-slate-700/80 rounded-2xl p-3.5 shadow-md space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-200 font-semibold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Skipli AI Builder</span>
                      </div>
                      {msg.version && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-[#D4AF37] border border-amber-500/30 font-semibold">
                          {msg.version}
                        </span>
                      )}
                    </div>

                    {msg.isStreaming && (
                      <div className="bg-[#112240] border border-slate-700 rounded-xl overflow-hidden transition-all duration-200">
                        <button
                          type="button"
                          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                          className="w-full px-3 py-2 flex items-center justify-between text-xs text-stone-300 hover:text-white bg-[#0f1d33] transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                            <span className="font-medium text-[11px] text-stone-200">Thinking...</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                          </div>
                          {isThinkingExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                          )}
                        </button>

                        {isThinkingExpanded && (
                          <div
                            ref={thinkingScrollRef}
                            className="p-2.5 bg-[#091326] text-[11px] font-mono text-stone-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-text border-t border-slate-800"
                          >
                            {formatThinkingPreview(msg.thinkingContent)}
                          </div>
                        )}
                      </div>
                    )}

                    {!msg.isStreaming && (
                      <div className="text-stone-300 leading-relaxed select-text whitespace-pre-wrap text-xs">
                        {chatService.formatChatDisplay(msg.text, msg.version, msg.isStreaming)}
                      </div>
                    )}

                    <div className="pt-1.5 flex items-center justify-end text-[10px] text-stone-500 border-t border-slate-800">
                      <span>{msg.time}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[#070F1E] border-t border-slate-800">
        <div className="bg-[#112240] border border-slate-700 focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37]/30 rounded-2xl p-2.5 shadow-lg transition">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Mô tả giao diện hoặc tính năng bạn muốn tạo (vd: Landing page khách sạn 5 sao...)"
            disabled={isStreaming}
            className="w-full resize-none bg-transparent outline-hidden text-xs text-stone-100 placeholder:text-stone-400 leading-relaxed max-h-40 font-sans"
          />

          <div className="flex items-center justify-end pt-2 border-t border-slate-700/60 mt-1">
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-red-400" />
                  <span>Dừng</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition shadow-md',
                    inputText.trim()
                      ? 'bg-[#D4AF37] text-[#0B192C] hover:bg-[#c5a12e] font-bold cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  )}
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#0B192C]" />
                  <span>Tạo Web</span>
                  <Send className="w-3 h-3 ml-0.5 text-[#0B192C]" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1.5 text-center text-[10px] text-stone-500">
          Nhấn <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-stone-400 border border-slate-700">Enter</kbd> để gửi,{' '}
          <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-stone-400 border border-slate-700">Shift + Enter</kbd> để xuống dòng
        </div>
      </div>
    </aside>
  );
};
