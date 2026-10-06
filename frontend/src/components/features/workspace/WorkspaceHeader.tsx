import { FC, useState } from 'react';
import { ViewportMode, ViewMode } from '../../../types/chat.types';
import { cn } from '../../../utils/cn';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Code2,
  Eye,
  Download,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface WorkspaceHeaderProps {
  hasStartedChat: boolean;
  viewport: ViewportMode;
  setViewport: (mode: ViewportMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onReset: () => void;
  onExport: () => void;
  user: { name?: string; email?: string } | null;
  logout: () => void;
}

export const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({
  hasStartedChat,
  viewport,
  setViewport,
  viewMode,
  setViewMode,
  onReset,
  onExport,
  user,
  logout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-14 bg-[#0B192C] border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-md text-stone-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/Skipli_logo.png" alt="Skipli" className="h-7 w-auto object-contain" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm leading-none text-white">Skipli</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#D4AF37] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                Canvas AI
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium cursor-pointer hover:text-white transition">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Dự án Web Sang Trọng</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </div>
      </div>

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

      <div className="flex items-center gap-2">
        {hasStartedChat && (
          <>
            <button
              onClick={onReset}
              title="Làm mới Canvas"
              className="p-2 text-stone-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onExport}
              className="flex items-center gap-1.5 text-xs font-medium text-[#0B192C] bg-[#D4AF37] hover:bg-[#c5a12e] px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer font-bold"
            >
              <Download className="w-3.5 h-3.5 text-[#0B192C]" />
              <span>Tải HTML</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
          </>
        )}

        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <div className="w-7 h-7 bg-[#1E3E62] text-[#D4AF37] font-semibold text-xs rounded-full flex items-center justify-center border border-amber-500/30">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#112240] rounded-xl shadow-xl border border-slate-700/80 py-1.5 z-50 text-xs text-stone-200">
              <div className="px-3 py-2 border-b border-slate-700/60">
                <p className="font-semibold text-white truncate">{user?.name || 'Người dùng'}</p>
                <p className="text-stone-400 text-[11px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/20 text-left font-medium transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
