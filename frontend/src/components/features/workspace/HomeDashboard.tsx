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
    <div className="flex-1 bg-[#0B192C] text-stone-100 flex flex-col justify-between overflow-y-auto px-6 py-12 relative select-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-radial from-[#1E3E62]/40 via-amber-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-auto space-y-7 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#112240] border border-slate-700/80 shadow-md text-xs font-semibold text-stone-200">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Skipli Canvas AI Engine</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Hôm nay bạn muốn thiết kế trang web gì,{' '}
            <span className="text-[#D4AF37] underline decoration-[#D4AF37]/50 decoration-2 underline-offset-8">
              {userName || 'bạn'}?
            </span>
          </h1>
        </div>

        <div className="w-full bg-[#112240] border border-slate-700/80 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 rounded-2xl p-4 shadow-2xl transition-all duration-200">
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ví dụ: Tạo landing page sang trọng cho khách sạn 5 sao với tone màu Navy Blue & Gold..."
            className="w-full resize-none bg-transparent outline-hidden text-sm text-stone-100 placeholder:text-stone-400 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-end pt-3 border-t border-slate-700/60 mt-2">
            <button
              onClick={handleCreate}
              disabled={!promptInput.trim() || isStreaming}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg',
                promptInput.trim() && !isStreaming
                  ? 'bg-[#D4AF37] text-[#0B192C] hover:bg-[#c5a12e] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              )}
            >
              <Wand2 className="w-4 h-4 text-[#0B192C]" />
              <span>Tạo Web Ngay</span>
              <Send className="w-3.5 h-3.5 ml-0.5 text-[#0B192C]" />
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-stone-500 py-3 z-10 border-t border-slate-800/60">
        Skipli Canvas © 2026. Built with GoClaw AI Engine & Navy Luxury Design System.
      </footer>
    </div>
  );
};
