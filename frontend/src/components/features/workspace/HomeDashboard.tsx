import { FC, useState, KeyboardEvent, MouseEvent, useRef } from 'react';
import {
  Sparkles,
  Send,
  Wand2,
  Plus,
  HardDrive,
  Globe,
  ArrowUpRight,
  Edit2,
  Trash2,
  Check,
  X,
  LogOut,
  FolderOpen,
  Clock,
  Layers,
} from 'lucide-react';
import { useSession } from '../../../contexts/SessionContext';
import { useAuth } from '../../../hooks/useAuth';
import { storageService } from '../../../services/storage.service';
import { Session } from '../../../types/session.types';
import { GroupedStorageList } from '../storage/GroupedStorageList';
import { StoragePreviewModal, StoragePreviewableItem } from '../storage/StoragePreviewModal';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { cn } from '../../../utils/cn';

interface HomeDashboardProps {
  userName?: string;
  onStartChat: (prompt: string) => void;
  onSelectSession: (sessionId: string) => void;
  isStreaming: boolean;
}

const QUICK_SUGGESTIONS = [
  'Luxury Artisan Bakery & Warm Cream Cafe',
  '5-Star Coastal Hotel & Beach Resort Landing Page',
  'Indochine Heritage Specialty Coffee Roasters',
  'Minimalist Architect & Interior Design Portfolio',
];

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const HomeDashboard: FC<HomeDashboardProps> = ({
  userName,
  onStartChat,
  onSelectSession,
  isStreaming,
}) => {
  const { user, logout } = useAuth();
  const {
    sessions,
    groupedStorageFiles,
    renameSession,
    deleteSession,
    deleteStorageFile,
    isLoadingSessions,
  } = useSession();

  const [promptInput, setPromptInput] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'storage'>('projects');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<StoragePreviewableItem | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCreate = () => {
    if (!promptInput.trim() || isStreaming) return;
    onStartChat(promptInput.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleStartRename = (e: MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      await renameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleConfirmDelete = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    setDeletingId(null);
  };

  const handleDownloadStorageFile = async (
    e: MouseEvent,
    fileId: string,
    fileName: string,
    versionId?: string
  ) => {
    e.stopPropagation();
    await storageService.downloadStorageFile(fileId, fileName, versionId);
  };

  const focusPromptInput = () => {
    textareaRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative flex-1 bg-[#FAF9F6] dark:bg-[#070F1E] text-slate-900 dark:text-stone-100 flex flex-col min-h-screen overflow-y-auto select-none transition-colors duration-200">
      {/* Aurora Mesh Gradient Backdrop (Lovable-inspired luxury glow for Light & Dark themes) */}
      <div className="absolute top-0 inset-x-0 h-[680px] overflow-hidden pointer-events-none select-none z-0">
        {/* Ambient Top Radial Canvas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),rgba(250,249,246,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(30,62,98,0.45),rgba(7,15,30,0))]" />

        {/* Glow Orb 1: Top-Left Vivid Royal Sky / Sapphire Blue */}
        <div className="absolute -top-24 -left-20 w-[460px] md:w-[600px] h-[460px] md:h-[600px] rounded-full bg-gradient-to-br from-sky-400/55 via-blue-500/45 to-indigo-500/35 dark:from-blue-600/45 dark:via-blue-800/40 dark:to-transparent blur-[75px] md:blur-[95px] transform-gpu" />

        {/* Glow Orb 2: Top-Right Vivid Lavender / Electric Violet */}
        <div className="absolute -top-20 -right-20 w-[440px] md:w-[560px] h-[440px] md:h-[560px] rounded-full bg-gradient-to-bl from-indigo-400/50 via-purple-400/40 to-pink-400/35 dark:from-indigo-600/40 dark:via-indigo-800/30 dark:to-transparent blur-[75px] md:blur-[95px] transform-gpu" />

        {/* Glow Orb 3: Center-Upper Radiant Champagne Gold / Amber Sunbeam */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[420px] md:w-[540px] h-[340px] rounded-full bg-gradient-to-b from-amber-400/50 via-gold-400/40 to-amber-200/25 dark:from-[#D4AF37]/30 dark:via-amber-500/20 dark:to-transparent blur-[65px] md:blur-[85px] transform-gpu" />

        {/* Glow Orb 4: Mid-Left Vivid Fuchsia Magenta / Pink Rose */}
        <div className="absolute top-48 -left-24 w-[400px] md:w-[520px] h-[400px] md:h-[520px] rounded-full bg-gradient-to-tr from-fuchsia-400/50 via-pink-400/45 to-rose-300/35 dark:from-fuchsia-600/35 dark:via-pink-700/25 dark:to-transparent blur-[80px] md:blur-[100px] transform-gpu" />

        {/* Glow Orb 5: Mid/Bottom-Right Warm Coral Rose / Sunset Gold */}
        <div className="absolute top-56 -right-24 w-[420px] md:w-[540px] h-[420px] md:h-[540px] rounded-full bg-gradient-to-tl from-rose-500/55 via-red-400/40 to-amber-300/35 dark:from-rose-600/35 dark:via-red-700/25 dark:to-transparent blur-[80px] md:blur-[100px] transform-gpu" />

        {/* Bottom Fade Gradient: Smooth fade down into page background */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/70 to-transparent dark:from-[#070F1E] dark:via-[#070F1E]/70 dark:to-transparent" />

        {/* Subtle Luxury Dot Matrix Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#0B192C_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035] dark:opacity-[0.05]" />
      </div>

      {/* 1. Header Trang Tổng Quan (Dashboard Top Bar) */}
      <header className="h-16 px-6 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between bg-white/70 dark:bg-[#070F1E]/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div
          onClick={focusPromptInput}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="Skipli Canvas"
        >
          <img
            src="/Skipli_logo.png"
            alt="Skipli Logo"
            className="h-7 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-[#0B192C] dark:text-white">
              Skipli
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
              Canvas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30 flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-stone-300 hidden sm:inline max-w-[120px] truncate">
                  {user.name || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section - Khung Prompt Khởi Tạo Nhanh */}
      <section className="relative px-6 pt-12 pb-14 max-w-5xl mx-auto w-full flex flex-col items-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#0B192C]/90 backdrop-blur-md border border-slate-300/90 dark:border-slate-700/80 shadow-xs text-xs font-bold text-slate-900 dark:text-stone-100 mb-4 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
          <span>Skipli AI Web Architect Engine</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-[#0B192C] dark:text-white tracking-tight leading-tight text-center max-w-3xl mb-3">
          What website would you like to build today,{' '}
          <span className="text-amber-600 dark:text-[#D4AF37] underline decoration-amber-500/40 decoration-2 underline-offset-8">
            {userName || 'Creator'}?
          </span>
        </h1>

        <p className="text-xs md:text-sm text-slate-700 dark:text-stone-300 font-medium text-center max-w-xl mb-6 font-sans leading-relaxed">
          Describe your business concept. Skipli AI will analyze the industry, curate a luxury palette, and generate a production-ready website in seconds.
        </p>

        {/* Khung nhập Prompt */}
        <div className="w-full bg-white/95 dark:bg-[#0B192C]/95 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700/80 focus-within:border-amber-500 dark:focus-within:border-[#D4AF37] focus-within:ring-4 focus-within:ring-amber-500/15 rounded-2xl p-4 shadow-xl shadow-slate-900/5 dark:shadow-2xl dark:shadow-black/70 transition-all duration-200 max-w-3xl">
          <textarea
            ref={textareaRef}
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Build an artisan French bakery website with warm cream and navy styling, featuring an interactive menu, cart drawer, and reservation form..."
            className="w-full resize-none bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-sm font-medium text-slate-950 dark:text-white placeholder:text-slate-500 dark:placeholder:text-stone-400 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/60 mt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-stone-300 hidden sm:inline-flex items-center gap-1">
              Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded text-[10px] font-mono border border-slate-300 dark:border-slate-600">Enter</kbd> to generate website
            </span>

            <button
              onClick={handleCreate}
              disabled={!promptInput.trim() || isStreaming}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-xs active:scale-95 cursor-pointer ml-auto',
                promptInput.trim() && !isStreaming
                  ? 'bg-[#D4AF37] text-slate-950 hover:bg-[#c59e2b]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              )}
            >
              <Wand2 className="w-4 h-4 text-slate-950" />
              <span>Generate Website</span>
              <Send className="w-3.5 h-3.5 ml-0.5 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Gợi ý ý tưởng nhanh */}
        <div className="flex items-center gap-2 flex-wrap justify-center mt-5 max-w-3xl">
          <span className="text-xs font-bold text-slate-900 dark:text-stone-100">Quick suggestions:</span>
          {QUICK_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPromptInput(item);
                textareaRef.current?.focus();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-[#0B192C] hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-stone-100 border border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs transition-all cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Dashboard Navigation Tabs: Projects & Storage */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-16 flex-1 flex flex-col z-10">
        {/* Navigation Dock: Hộp điều hướng rõ ràng, tách biệt hoàn toàn khỏi nền ở cả 2 theme */}
        <div className="bg-white/95 dark:bg-[#0B192C]/95 backdrop-blur-xl border border-slate-300 dark:border-slate-800 rounded-2xl p-2 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-sm dark:shadow-xl">
          {/* Tabs Group: Segmented pill controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070F1E] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer',
                activeTab === 'projects'
                  ? 'bg-white dark:bg-[#1E3E62] text-[#0B192C] dark:text-white shadow-xs border border-slate-200/90 dark:border-amber-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              )}
            >
              <FolderOpen className={cn('w-4 h-4', activeTab === 'projects' ? 'text-amber-600 dark:text-[#D4AF37]' : 'text-slate-500 dark:text-slate-400')} />
              <span>My Projects</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-mono font-bold',
                  activeTab === 'projects'
                    ? 'bg-amber-500/15 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {sessions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer',
                activeTab === 'storage'
                  ? 'bg-white dark:bg-[#1E3E62] text-[#0B192C] dark:text-white shadow-xs border border-slate-200/90 dark:border-amber-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              )}
            >
              <HardDrive className={cn('w-4 h-4', activeTab === 'storage' ? 'text-amber-600 dark:text-[#D4AF37]' : 'text-slate-500 dark:text-slate-400')} />
              <span>Cloud Storage</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-mono font-bold',
                  activeTab === 'storage'
                    ? 'bg-amber-500/15 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {groupedStorageFiles.length}
              </span>
            </button>
          </div>

          {/* Action Button: Nút Tạo dự án mới nổi bật, rõ ràng */}
          <button
            type="button"
            onClick={focusPromptInput}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer border border-amber-400/80"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>

        {/* Nội dung Tab 1: Danh sách Lưới Dự án (Projects Grid) */}
        {activeTab === 'projects' && (
          <div className="flex-1">
            {isLoadingSessions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center bg-white dark:bg-[#0B192C] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-[#D4AF37] border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-1.5">
                  No website projects yet
                </h3>
                <p className="text-xs font-medium text-slate-600 dark:text-stone-300 max-w-sm mx-auto mb-5 leading-relaxed font-sans">
                  Enter your prompt above to start crafting your first website with Skipli AI!
                </p>
                <button
                  type="button"
                  onClick={focusPromptInput}
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c59e2b] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Create First Website
                </button>
              </div>
            ) : (
              /* Grid các Project Cards: Chuẩn tỷ lệ, cân đối, sắc nét */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {sessions.map((session: Session) => {
                  const isRenaming = editingId === session.id;
                  const isDeleting = deletingId === session.id;
                  const versionTag = session.versionCount > 0 ? `v1.${session.versionCount}` : 'v1.1';

                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className="group bg-white dark:bg-[#0B192C] border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/80 dark:hover:border-amber-400/80 rounded-2xl p-5 shadow-xs hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[175px]"
                    >
                      {/* Top: Icon + Version Tag + Action Icons */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-[#1E3E62] border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-[#D4AF37] group-hover:scale-105 transition-transform">
                            <Globe className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30">
                            {versionTag}
                          </span>
                        </div>

                        {/* Actions (Rename & Delete) */}
                        <div
                          className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(e, session.id, session.title)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Rename project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(session.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Title & Delete Confirmation */}
                      <div className="flex-1 min-w-0 mb-3">
                        {isRenaming ? (
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e as any, session.id);
                                if (e.key === 'Escape') handleCancelRename(e as any);
                              }}
                              autoFocus
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:outline-none focus:ring-0 font-sans"
                            />
                            <button
                              type="button"
                              onClick={(e) => handleSaveRename(e, session.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <h4
                            className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-[#D4AF37] transition-colors line-clamp-2 leading-snug"
                            title={session.title}
                          >
                            {session.title || 'Untitled Project'}
                          </h4>
                        )}

                        {isDeleting && (
                          <div
                            className="mt-2 p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                              Delete this project?
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => handleConfirmDelete(e, session.id)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-stone-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Timestamp + Open Workspace CTA */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-stone-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{formatRelativeTime(session.updatedAt || session.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-stone-300 group-hover:text-amber-600 dark:group-hover:text-[#D4AF37] transition-colors">
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Nội dung Tab 2: Danh sách Kho Lưu Trữ (Storage) */}
        {activeTab === 'storage' && (
          <div className="flex-1 bg-white dark:bg-[#0B192C] rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-extrabold text-[#0B192C] dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>HTML Files & Stored Versions</span>
              </h3>
              <p className="text-xs font-medium text-slate-600 dark:text-stone-300 mt-1 font-sans">
                All HTML versions generated across projects are safely grouped and backed up on MinIO S3.
              </p>
            </div>

            <GroupedStorageList
              groups={groupedStorageFiles}
              onSelectFile={(file) => setSelectedPreviewFile(file)}
              onDownloadFile={handleDownloadStorageFile}
              onQuickSwitchSession={onSelectSession}
              onDeleteFile={async (fileId) => {
                await deleteStorageFile(fileId);
              }}
            />
          </div>
        )}
      </section>

      {/* Modal Xem Trước Tệp HTML trong Storage */}
      <StoragePreviewModal
        isOpen={Boolean(selectedPreviewFile)}
        file={selectedPreviewFile}
        onClose={() => setSelectedPreviewFile(null)}
        onDownload={async (fileId, fileName, versionId) => {
          await storageService.downloadStorageFile(fileId, fileName, versionId);
        }}
      />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-stone-500 py-4 border-t border-slate-200/80 dark:border-slate-800/60 mt-auto">
        Skipli Canvas © 2026. Built with GoClaw AI Engine & Navy Luxury Design System.
      </footer>
    </div>
  );
};
