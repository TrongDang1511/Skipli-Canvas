import { FC } from 'react';
import { ViewportMode, ViewMode } from '../../../types/chat.types';
import { cn } from '../../../utils/cn';
import {
  Monitor,
  Tablet,
  Smartphone,
  Code2,
  Eye,
  Download,
  Sparkles,
} from 'lucide-react';

interface WorkspaceHeaderProps {
  hasStartedChat: boolean;
  viewport: ViewportMode;
  setViewport: (mode: ViewportMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExport: () => void;
  sessionTitle?: string;
}

export const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({
  hasStartedChat,
  viewport,
  setViewport,
  viewMode,
  setViewMode,
  onExport,
  sessionTitle,
}) => {
  return (
    <header className="h-14 bg-[#0B192C] border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-md text-stone-100">
      {/* Left Branding & Active Session Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <img src="/Skipli_logo.png" alt="Skipli" className="h-7 w-auto object-contain" />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm leading-none text-white">Skipli</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[#D4AF37] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
              Canvas AI
            </span>
          </div>
        </div>

        {sessionTitle && (
          <>
            <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium max-w-sm truncate">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="truncate">{sessionTitle}</span>
            </div>
          </>
        )}
      </div>

      {/* Center View Mode & Viewport Switchers */}
      {hasStartedChat && (
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#112240] p-0.5 rounded-lg border border-slate-700/80 text-xs font-medium">
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer',
                viewMode === 'preview'
                  ? 'bg-[#1E3E62] text-white shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              )}
            >
              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Xem Trước</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer',
                viewMode === 'code'
                  ? 'bg-[#1E3E62] text-white shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Mã Nguồn</span>
            </button>
          </div>

          {viewMode === 'preview' && (
            <div className="flex items-center bg-[#112240] p-0.5 rounded-lg border border-slate-700/80 text-stone-400">
              <button
                onClick={() => setViewport('desktop')}
                title="Màn hình Desktop"
                className={cn(
                  'p-1.5 rounded-md transition cursor-pointer',
                  viewport === 'desktop' ? 'bg-[#1E3E62] text-white shadow-xs' : 'hover:text-stone-200'
                )}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Máy tính bảng Tablet"
                className={cn(
                  'p-1.5 rounded-md transition cursor-pointer',
                  viewport === 'tablet' ? 'bg-[#1E3E62] text-white shadow-xs' : 'hover:text-stone-200'
                )}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Điện thoại Mobile"
                className={cn(
                  'p-1.5 rounded-md transition cursor-pointer',
                  viewport === 'mobile' ? 'bg-[#1E3E62] text-white shadow-xs' : 'hover:text-stone-200'
                )}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right Export Action */}
      <div className="flex items-center gap-2">
        {hasStartedChat && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 text-xs font-medium text-[#0B192C] bg-[#D4AF37] hover:bg-[#c5a12e] px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer font-bold"
          >
            <Download className="w-3.5 h-3.5 text-[#0B192C]" />
            <span>Tải HTML</span>
          </button>
        )}
      </div>
    </header>
  );
};
