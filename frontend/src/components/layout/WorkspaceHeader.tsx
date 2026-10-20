import { FC, useState, MouseEvent } from 'react';
import { ArrowLeft, Pencil, Check, X, Plus, LogOut } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

interface WorkspaceHeaderProps {
  sessionTitle?: string;
  activeVersion?: string;
  onBackToDashboard: () => void;
  onNewProject: () => void;
  onRenameTitle?: (newTitle: string) => Promise<void>;
}

export const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({
  sessionTitle = 'Dự án không tên',
  activeVersion,
  onBackToDashboard,
  onNewProject,
  onRenameTitle,
}) => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(sessionTitle);

  const handleStartRename = (e: MouseEvent) => {
    e.stopPropagation();
    setTitleInput(sessionTitle);
    setIsEditing(true);
  };

  const handleSaveRename = async (e: MouseEvent) => {
    e.stopPropagation();
    if (titleInput.trim() && onRenameTitle) {
      await onRenameTitle(titleInput.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const cleanVersion = activeVersion ? activeVersion.replace(/\s*\([^)]*\)/g, '').trim() : undefined;

  return (
    <header className="h-13 bg-white dark:bg-[#0B192C] border-b border-slate-200/90 dark:border-slate-800/90 px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors duration-200 shadow-2xs dark:shadow-md">
      {/* Khối bên trái: Logo SkipliCanvas (Click -> Back Dashboard) + Nút Quay Lại + Tên Dự Án */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Logo SkipliCanvas: Khi ấn vào logo sẽ tự động quay về Dashboard */}
        <button
          type="button"
          onClick={onBackToDashboard}
          title="Quay về Dashboard chính"
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer group shrink-0 active:scale-95"
        >
          <img
            src="/Skipli_logo.png"
            alt="Skipli Logo"
            className="h-6 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-[#0B192C] dark:text-white">
              Skipli
            </span>
            <span className="text-[9px] font-bold text-amber-600 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
              Canvas
            </span>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Nút quay về Dashboard */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-stone-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          title="Quay lại danh sách dự án"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

        {/* Tên Dự Án Hiện Tại & Phiên Bản */}
        <div className="flex items-center gap-2 min-w-0 max-w-md">
          {isEditing ? (
            <div className="flex items-center gap-1 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(e as any);
                  if (e.key === 'Escape') handleCancelRename(e as any);
                }}
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-800 border border-amber-500 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:outline-none focus:ring-0 font-sans"
              />
              <button
                type="button"
                onClick={handleSaveRename}
                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
                title="Lưu tên mới"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                title="Hủy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-1.5 min-w-0">
              <span
                className="font-bold text-xs text-slate-900 dark:text-stone-100 truncate cursor-pointer"
                title={sessionTitle}
                onClick={handleStartRename}
              >
                {sessionTitle}
              </span>
              {onRenameTitle && (
                <button
                  type="button"
                  onClick={handleStartRename}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 dark:hover:text-[#D4AF37] rounded transition cursor-pointer"
                  title="Sửa tên dự án"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Badge phiên bản đang active */}
          {cleanVersion && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30 shrink-0">
              {cleanVersion}
            </span>
          )}
        </div>
      </div>

      {/* Khối bên phải: Tạo web mới + ThemeToggle + User + Logout */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] text-slate-950 hover:bg-amber-400 dark:bg-[#1E3E62] dark:text-[#D4AF37] dark:hover:bg-[#28507e] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-amber-400/60 active:scale-95"
          title="Tạo thêm dự án mới"
        >
          <Plus className="w-3.5 h-3.5 text-slate-950 dark:text-[#D4AF37]" />
          <span className="hidden md:inline">Dự án mới</span>
        </button>

        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30 flex items-center justify-center text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
