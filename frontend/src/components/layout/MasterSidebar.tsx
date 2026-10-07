import { FC, useState, MouseEvent } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useAuth } from '../../hooks/useAuth';
import { storageService } from '../../services/storage.service';
import { cn } from '../../utils/cn';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MessageSquare,
  HardDrive,
  Edit2,
  Trash2,
  Check,
  X,
  Download,
  LogOut,
  Sparkles,
  Code2,
} from 'lucide-react';

interface MasterSidebarProps {
  onNewWeb: () => void;
  onSelectSession: (id: string) => void;
}

export const MasterSidebar: FC<MasterSidebarProps> = ({
  onNewWeb,
  onSelectSession,
}) => {

  const { user, logout } = useAuth();
  const {
    sessions,
    storageFiles,
    activeSessionId,
    isSidebarOpen,
    toggleSidebar,
    activeTab,
    setActiveTab,
    renameSession,
    deleteSession,
    deleteStorageFile,
  } = useSession();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingStorageId, setDeletingStorageId] = useState<string | null>(null);

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

  const handleConfirmDeleteStorage = async (e: MouseEvent, fileId: string) => {
    e.stopPropagation();
    await deleteStorageFile(fileId);
    setDeletingStorageId(null);
  };

  const handleDownloadStorageFile = async (e: MouseEvent, fileId: string, fileName: string) => {
    e.stopPropagation();
    await storageService.downloadStorageFile(fileId, fileName);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(1)} MB`;
  };



  if (!isSidebarOpen) {
    return (
      <div className="w-14 bg-[#081220] border-r border-slate-800/90 flex flex-col items-center py-3 z-20 shrink-0 select-none transition-all duration-300 shadow-lg">
        <button
          onClick={toggleSidebar}
          title="Mở rộng Thanh điều hướng"
          className="p-2 text-stone-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
        >
          <PanelLeftOpen className="w-5 h-5 text-[#D4AF37]" />
        </button>

        <div className="h-[1px] w-8 bg-slate-800 my-3" />

        <button
          onClick={onNewWeb}
          title="Tạo Web Mới"
          className="p-2.5 bg-[#1E3E62] text-[#D4AF37] hover:bg-[#28507e] rounded-xl shadow-xs transition cursor-pointer border border-amber-500/30"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col items-center gap-3 mt-4">
          <button
            onClick={() => {
              setActiveTab('chats');
              toggleSidebar();
            }}
            title="Lịch sử hội thoại"
            className={cn(
              'p-2 rounded-lg transition cursor-pointer',
              activeTab === 'chats'
                ? 'bg-[#1E3E62] text-[#D4AF37] shadow-xs'
                : 'text-stone-400 hover:bg-slate-800/60 hover:text-stone-200'
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setActiveTab('storage');
              toggleSidebar();
            }}
            title="Storage Mã nguồn HTML"
            className={cn(
              'p-2 rounded-lg transition cursor-pointer',
              activeTab === 'storage'
                ? 'bg-[#1E3E62] text-[#D4AF37] shadow-xs'
                : 'text-stone-400 hover:bg-slate-800/60 hover:text-stone-200'
            )}
          >
            <HardDrive className="w-5 h-5" />
          </button>
        </div>

        <div className="w-8 h-8 bg-[#1E3E62] text-[#D4AF37] font-semibold text-xs rounded-full flex items-center justify-center border border-amber-500/30 shadow-xs">
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 bg-[#081220] border-r border-slate-800/90 flex flex-col z-20 shrink-0 select-none transition-all duration-300 shadow-xl text-stone-200">
      {/* 1. Top Header: Branding & Toggle Button */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B192C]">
        <div className="flex items-center gap-2">
          <img src="/Skipli_logo.png" alt="Skipli" className="h-6 w-auto object-contain" />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white">Skipli</span>
            <span className="text-[9px] font-bold text-[#D4AF37] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Canvas AI
            </span>
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          title="Thu gọn Sidebar"
          className="p-1.5 text-stone-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* 2. New Project Action Button */}
      <div className="p-3 border-b border-slate-800/80 bg-[#070F1E]">
        <button
          onClick={onNewWeb}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1E3E62] hover:bg-[#254d7b] text-[#D4AF37] rounded-xl font-semibold text-xs tracking-wide shadow-xs border border-amber-500/30 transition active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Tạo Web Mới</span>
        </button>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center px-3 pt-2.5 pb-2 gap-1.5 border-b border-slate-800/80 bg-[#070F1E] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chats')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer border',
            activeTab === 'chats'
              ? 'bg-[#1E3E62] text-white border-slate-700 shadow-xs'
              : 'border-transparent text-stone-400 hover:bg-slate-800/60 hover:text-stone-200'
          )}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Lịch Sử ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer border',
            activeTab === 'storage'
              ? 'bg-[#1E3E62] text-white border-slate-700 shadow-xs'
              : 'border-transparent text-stone-400 hover:bg-slate-800/60 hover:text-stone-200'
          )}
        >
          <HardDrive className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Storage</span>
        </button>
      </div>

      {/* 4. Tab Content List */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-1 custom-scrollbar">
        {activeTab === 'chats' ? (
          /* TAB 1: Chat Sessions History */
          sessions.length === 0 ? (
            <div className="py-12 px-4 text-center text-stone-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]/50" />
              <p className="font-medium text-stone-400">Chưa có phiên hội thoại nào</p>
              <p className="text-[11px] text-stone-500 mt-1">Bấm "Tạo Web Mới" để bắt đầu thiết kế!</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;
              const isDeleting = session.id === deletingId;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer border',
                    isActive
                      ? 'bg-[#1E3E62]/80 border-slate-700 text-white font-semibold shadow-xs border-l-4 border-l-[#D4AF37]'
                      : 'border-transparent hover:bg-slate-800/50 text-stone-300 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        isActive ? 'text-[#D4AF37]' : 'text-stone-400 group-hover:text-stone-300'
                      )}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(e as unknown as MouseEvent, session.id);
                          if (e.key === 'Escape') handleCancelRename(e as unknown as MouseEvent);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-900 border border-amber-500/60 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <span className="truncate font-medium text-xs tracking-tight">
                        {session.title || 'Phiên chưa đặt tên'}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleSaveRename(e, session.id)}
                        title="Lưu đổi tên"
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        title="Hủy"
                        className="p-1 text-stone-400 hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isDeleting ? (
                    <div className="flex items-center gap-1 shrink-0 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/40">
                      <span className="text-[10px] font-semibold text-red-400">Xóa?</span>
                      <button
                        onClick={(e) => handleConfirmDelete(e, session.id)}
                        className="text-red-400 hover:text-red-300 font-bold text-[11px] cursor-pointer ml-1"
                      >
                        Có
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="text-stone-400 hover:text-stone-200 text-[11px] cursor-pointer ml-1"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition">
                      <button
                        onClick={(e) => handleStartRename(e, session.id, session.title)}
                        title="Đổi tên"
                        className="p-1 text-stone-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(session.id);
                        }}
                        title="Xóa phiên"
                        className="p-1 text-stone-400 hover:text-red-400 hover:bg-red-500/20 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* TAB 2: Storage (Mã nguồn HTML đã tạo) */
          storageFiles.length === 0 ? (
            <div className="py-12 px-4 text-center text-stone-500 text-xs">
              <Code2 className="w-6 h-6 mx-auto mb-2 text-stone-500/60" />
              <p className="font-medium text-stone-400">Chưa có file HTML nào</p>
              <p className="text-[11px] text-stone-500 mt-1">
                Giao diện HTML sinh ra từ AI sẽ được tự động lưu ở đây!
              </p>
            </div>
          ) : (
            storageFiles.map((file) => {
              const isDeletingStorage = deletingStorageId === file.id;

              return (
                <div
                  key={`storage-${file.id}`}
                  onClick={() => onSelectSession(file.sessionId)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-800/90 bg-[#0F1D32] hover:border-[#D4AF37] hover:bg-[#152744] hover:shadow-xs text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Code2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-stone-200 truncate">
                          {file.sessionTitle || file.fileName}
                        </span>
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1 py-0.2 rounded">
                          {file.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <span>{new Date(file.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span className="font-mono text-stone-400">{formatFileSize(file.sizeBytes)}</span>
                      </div>
                    </div>
                  </div>

                  {isDeletingStorage ? (
                    <div className="flex items-center gap-1 shrink-0 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/40">
                      <span className="text-[10px] font-semibold text-red-400">Xóa?</span>
                      <button
                        onClick={(e) => handleConfirmDeleteStorage(e, file.id)}
                        className="text-red-400 hover:text-red-300 font-bold text-[11px] cursor-pointer ml-1"
                      >
                        Có
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingStorageId(null);
                        }}
                        className="text-stone-400 hover:text-stone-200 text-[11px] cursor-pointer ml-1"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDownloadStorageFile(e, file.id, file.fileName)}
                        title="Tải file HTML về máy"
                        className="p-1.5 text-stone-300 bg-slate-800 hover:bg-[#D4AF37] hover:text-[#0B192C] rounded-lg transition cursor-pointer shrink-0 font-semibold border border-slate-700/60"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingStorageId(file.id);
                        }}
                        title="Xóa file khỏi kho"
                        className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>


      {/* 5. User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070F1E] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 bg-[#1E3E62] text-[#D4AF37] font-bold text-xs rounded-full flex items-center justify-center border border-amber-500/30 shadow-xs shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-white truncate">
              {user?.name || 'Người dùng'}
            </span>
            <span className="text-[10px] text-stone-400 truncate">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Đăng xuất"
          className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
