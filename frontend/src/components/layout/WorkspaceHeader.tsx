import { FC, useState, MouseEvent } from 'react';
import { ArrowLeft, Pencil, Check, X, Plus, LogOut, MessageSquare, Globe } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { ProfileSettingsModal } from '../features/auth/ProfileSettingsModal';

interface WorkspaceHeaderProps {
  sessionTitle?: string;
  activeVersion?: string;
  onBackToDashboard: () => void;
  onNewProject: () => void;
  onRenameTitle?: (newTitle: string) => Promise<void>;
  mobileTab?: 'chat' | 'preview';
  onSelectMobileTab?: (tab: 'chat' | 'preview') => void;
  isStreaming?: boolean;
}

export const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({
  sessionTitle = 'Untitled Project',
  activeVersion,
  onBackToDashboard,
  onNewProject,
  onRenameTitle,
  mobileTab,
  onSelectMobileTab,
  isStreaming = false,
}) => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
    <header className="h-13 bg-white dark:bg-[#0B192C] border-b border-slate-200/90 dark:border-slate-800/90 px-2 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors duration-200 shadow-2xs dark:shadow-md gap-1.5 sm:gap-2">
      {/* Khối bên trái: Nút Quay Về Dashboard (LUÔN CỐ ĐỊNH ĐẦU TIÊN) + Logo + Tên Dự Án */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
        {/* Nút quay về Dashboard: Ưu tiên số 1, luôn hiển thị rõ ràng trên mọi kích thước màn hình */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#0B192C] dark:text-stone-200 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 transition cursor-pointer shrink-0 active:scale-95 touch-manipulation"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-[#1E3E62] dark:text-[#D4AF37] shrink-0" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* Logo SkipliCanvas */}
        <button
          type="button"
          onClick={onBackToDashboard}
          title="Skipli Canvas"
          className="hidden sm:flex items-center gap-1.5 px-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer group shrink-0 active:scale-95"
        >
          <img
            src="/Skipli_logo.png"
            alt="Skipli Logo"
            className="h-5 sm:h-6 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
          <div className="hidden md:flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-[#0B192C] dark:text-white">
              Skipli
            </span>
            <span className="text-[9px] font-bold text-amber-600 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
              Canvas
            </span>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden md:block" />

        {/* Tên Dự Án Hiện Tại & Phiên Bản (Hiển thị từ md trở lên để không chật chội trên mobile) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-[130px] lg:max-w-xs">
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
                title="Save new name"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelRename}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                title="Cancel"
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
                  title="Rename project"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Badge phiên bản đang active */}
          {cleanVersion && (
            <span className="text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30 shrink-0">
              {cleanVersion}
            </span>
          )}
        </div>
      </div>

      {/* Cụm ở giữa: Mobile Segmented Tab Switcher (Chat vs Preview) - Chỉ hiển thị trên < lg */}
      {mobileTab && onSelectMobileTab && (
        <div className="flex lg:hidden items-center p-0.5 bg-slate-100 dark:bg-[#070F1E] rounded-xl border border-slate-200/90 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onSelectMobileTab('chat')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation',
              mobileTab === 'chat'
                ? 'bg-white dark:bg-[#1E3E62] text-[#0B192C] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectMobileTab('preview')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation relative',
              mobileTab === 'preview'
                ? 'bg-white dark:bg-[#1E3E62] text-[#0B192C] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
            <span>Preview</span>
            {isStreaming && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Khối bên phải: Tạo web mới + ThemeToggle + User + Logout */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onNewProject}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-[#1E3E62] text-white hover:bg-[#28507e] dark:bg-[#1E3E62] dark:text-white dark:hover:bg-[#28507e] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-[#16304d] dark:border-blue-400/30 active:scale-95 touch-manipulation"
          title="Create a new project"
        >
          <Plus className="w-3.5 h-3.5 text-[#D4AF37] dark:text-amber-300" />
          <span className="hidden md:inline">New Project</span>
        </button>

        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30 flex items-center justify-center text-xs font-bold shrink-0 hover:border-amber-500/60 hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Profile & Security Settings"
            >
              {user.displayName?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            <ProfileSettingsModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
          </div>
        )}
      </div>
    </header>
  );
};
