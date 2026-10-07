import { FC, useState, KeyboardEvent } from 'react';
import { Sparkles, Send, Wand2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface HomeDashboardProps {
  userName?: string;
  onStartChat: (prompt: string) => void;
  isStreaming: boolean;
}

export const HomeDashboard: FC<HomeDashboardProps> = ({
  userName,
  onStartChat,
  isStreaming,
}) => {
  const [promptInput, setPromptInput] = useState('');

  const handleCreate = () => {
    if (!promptInput.trim() || isStreaming) return;
    onStartChat(promptInput);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="flex-1 bg-[#FAF9F6] dark:bg-[#0B192C] text-slate-900 dark:text-stone-100 flex flex-col justify-between overflow-y-auto px-6 py-12 relative select-none transition-colors duration-200">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-radial from-amber-500/10 via-slate-200/40 to-transparent dark:from-[#1E3E62]/40 dark:via-amber-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-auto space-y-7 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#112240] border border-slate-200/90 dark:border-slate-700/80 shadow-xs text-xs font-semibold text-slate-800 dark:text-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37]" />
          <span>Skipli Canvas AI Engine</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy-900 dark:text-white tracking-tight leading-tight">
            Hôm nay bạn muốn thiết kế trang web gì,{' '}
            <span className="text-amber-600 dark:text-[#D4AF37] underline decoration-amber-500/50 decoration-2 underline-offset-8">
              {userName || 'bạn'}?
            </span>
          </h1>
        </div>

        <div className="w-full bg-white dark:bg-[#112240] border border-slate-200 dark:border-slate-700/80 focus-within:border-amber-500 dark:focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl p-4 shadow-sm dark:shadow-2xl transition-all duration-200">
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ví dụ: Tạo landing page sang trọng cho khách sạn 5 sao với tone màu Navy Blue & Gold..."
            className="w-full resize-none bg-transparent outline-hidden text-sm text-slate-900 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-400 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-2">
            <button
              onClick={handleCreate}
              disabled={!promptInput.trim() || isStreaming}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-xs active:scale-95',
                promptInput.trim() && !isStreaming
                  ? 'bg-[#D4AF37] text-slate-950 hover:bg-[#c59e2b] cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              )}
            >
              <Wand2 className="w-4 h-4 text-slate-950" />
              <span>Tạo Web Ngay</span>
              <Send className="w-3.5 h-3.5 ml-0.5 text-slate-950" />
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 dark:text-stone-500 py-3 z-10 border-t border-slate-200/80 dark:border-slate-800/60">
        Skipli Canvas © 2026. Built with GoClaw AI Engine & Navy Luxury Design System.
      </footer>
    </div>
  );
};
