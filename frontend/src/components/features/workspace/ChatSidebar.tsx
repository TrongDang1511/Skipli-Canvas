import { FC, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChatMessage } from '../../../types/chat.types';
import { chatService } from '../../../services/chat.service';
import { FormattedChatMessage } from '../../ui/FormattedChatMessage';
import { cn } from '../../../utils/cn';
import {
  Sparkles,
  Send,
  Square,
  Wand2,
  Layers,
  Copy,
  Check,
  Pencil,
} from 'lucide-react';

interface ChatSidebarProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendPrompt: (prompt: string) => void;
  onStopGeneration: () => void;
  sessionTitle?: string;
  onStartRollback?: (message: ChatMessage, index: number) => void;
  prefillPrompt?: string;
}

export const ChatSidebar: FC<ChatSidebarProps> = ({
  messages,
  isStreaming,
  onSendPrompt,
  onStopGeneration,
  sessionTitle,
  onStartRollback,
  prefillPrompt,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (prefillPrompt !== undefined && prefillPrompt !== '') {
      setInputText(prefillPrompt);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
          textareaRef.current.focus();
          const len = prefillPrompt.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
    }
  }, [prefillPrompt]);

  const handleCopyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.warn('Failed to copy prompt:', err);
    }
  };

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

  return (
    <aside className="w-[400px] max-w-[400px] bg-white dark:bg-[#0B192C] border-r border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-stone-100 flex flex-col h-full shrink-0 select-none shadow-xs dark:shadow-xl z-20 transition-colors duration-200">
      <div className="h-12 px-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-stone-300 bg-slate-50/80 dark:bg-[#070F1E]/80">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {sessionTitle ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37] shrink-0" />
              <span className="truncate text-navy-900 dark:text-white font-bold" title={sessionTitle}>
                {sessionTitle}
              </span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37] shrink-0" />
              <span className="truncate">Lịch Sử Tương Tác & Lệnh Prompt</span>
            </>
          )}
        </div>
        <span className="text-[10px] text-slate-600 dark:text-stone-400 bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded font-mono shrink-0">
          {messages.length} bước
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';

          return (
            <div key={msg.id} className="space-y-2">
              {!isAi && (
                <div className="group flex flex-col items-end">
                  <div className="max-w-[88%] bg-amber-500/10 dark:bg-[#1E3E62] text-slate-900 dark:text-white p-3 rounded-2xl rounded-tr-xs shadow-2xs border border-amber-500/30 dark:border-slate-700/60">
                    <p className="leading-relaxed whitespace-pre-wrap select-text font-medium">{msg.text}</p>
                    <span className="text-[10px] text-amber-800/80 dark:text-stone-400 mt-1 block text-right">
                      {msg.time}
                    </span>
                  </div>

                  {/* Hover Action Bar: Copy + Sửa Prompt (Hình 3) */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-1 mr-1">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(msg.id, msg.text)}
                      title="Sao chép prompt"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {onStartRollback && (
                      <button
                        type="button"
                        onClick={() => onStartRollback(msg, index)}
                        title="Sửa prompt & Quay lại bước này"
                        className="p-1 px-1.5 rounded-md text-amber-700 dark:text-[#D4AF37] hover:bg-amber-500/15 transition cursor-pointer flex items-center gap-1 bg-amber-500/10 border border-amber-500/30"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="text-[10px] font-semibold">Sửa prompt</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isAi && (
                <div className="space-y-2">
                  <div className="bg-slate-50 dark:bg-[#0e1e36] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs dark:shadow-md space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-navy-900 dark:text-stone-200 font-semibold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37]" />
                        <span>Skipli AI Builder</span>
                      </div>
                      {msg.version && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-[#D4AF37] border border-amber-500/30 font-semibold">
                          {msg.version}
                        </span>
                      )}
                    </div>

                    {msg.isLoading && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#112240] border border-slate-200 dark:border-slate-700/80 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#D4AF37] animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#D4AF37] animate-bounce" />
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-stone-200">
                          Skipli AI đang xử lý và kiến tạo giao diện...
                        </span>
                      </div>
                    )}

                    {!msg.isLoading && (
                      <FormattedChatMessage
                        content={chatService.formatChatDisplay(msg.text, msg.version, msg.isLoading)}
                      />
                    )}

                    <div className="pt-1.5 flex items-center justify-end text-[10px] text-slate-400 dark:text-stone-500 border-t border-slate-200/80 dark:border-slate-800">
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

      <div className="p-3 bg-slate-50 dark:bg-[#070F1E] border-t border-slate-200/90 dark:border-slate-800">
        <div className="bg-white dark:bg-[#112240] border border-slate-200 dark:border-slate-700 focus-within:border-amber-500 dark:focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-amber-500/30 rounded-2xl p-2.5 shadow-xs dark:shadow-lg transition">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Mô tả giao diện hoặc tính năng bạn muốn tạo (vd: Landing page khách sạn 5 sao...)"
            disabled={isStreaming}
            className="w-full resize-none bg-transparent outline-hidden text-xs text-slate-900 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-400 leading-relaxed max-h-40 font-sans"
          />

          <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500/40 text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Dừng</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition shadow-xs active:scale-95',
                    inputText.trim()
                      ? 'bg-[#D4AF37] text-slate-950 hover:bg-[#c59e2b] font-bold cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  )}
                >
                  <Wand2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Tạo Web</span>
                  <Send className="w-3 h-3 ml-0.5 text-slate-950" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-stone-500">
          Nhấn <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded text-[9px] font-mono text-slate-600 dark:text-stone-400 border border-slate-200 dark:border-slate-700">Enter</kbd> để gửi,{' '}
          <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded text-[9px] font-mono text-slate-600 dark:text-stone-400 border border-slate-200 dark:border-slate-700">Shift + Enter</kbd> để xuống dòng
        </div>
      </div>
    </aside>
  );
};
