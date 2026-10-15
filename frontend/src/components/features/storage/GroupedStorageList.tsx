import { FC, useState, MouseEvent } from 'react';
import { GroupedSessionStorageItem, StorageFileVersionItem } from '../../../types/storage.types';
import { StoragePreviewableItem } from './StoragePreviewModal';
import { cn } from '../../../utils/cn';
import {
  FolderGit2,
  Code2,
  Download,
  Trash2,
  Layers,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

interface GroupedStorageListProps {
  groups: GroupedSessionStorageItem[];
  activeSessionId?: string | null;
  onSelectFile: (file: StoragePreviewableItem) => void;
  onDownloadFile: (e: MouseEvent, fileId: string, fileName: string) => void;
  onQuickSwitchSession: (sessionId: string) => void;
  onDeleteFile?: (fileId: string) => Promise<void> | void;
}

export const GroupedStorageList: FC<GroupedStorageListProps> = ({
  groups,
  activeSessionId,
  onSelectFile,
  onDownloadFile,
  onQuickSwitchSession,
  onDeleteFile,
}) => {
  const [deletingStorageId, setDeletingStorageId] = useState<string | null>(null);

  if (!groups || groups.length === 0) {
    return (
      <div className="py-12 px-4 text-center text-slate-400 dark:text-stone-500 text-xs">
        <Layers className="w-8 h-8 mx-auto mb-2.5 text-slate-400/60 dark:text-stone-500/60 stroke-[1.5]" />
        <p className="font-semibold text-slate-700 dark:text-stone-300">Chưa có mã nguồn HTML nào</p>
        <p className="text-[11px] text-slate-400 dark:text-stone-500 mt-1">
          Các phiên bản HTML sinh ra theo từng phiên chat sẽ được phân nhóm lưu trữ tại đây!
        </p>
      </div>
    );
  }

  const handleConfirmDelete = async (e: MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (onDeleteFile) {
      await onDeleteFile(fileId);
    }
    setDeletingStorageId(null);
  };

  return (
    <div className="space-y-4 pb-4 select-none">
      {groups.map((group, groupIndex) => {
        const isCurrentActiveSession = group.sessionId === activeSessionId;

        return (
          <div key={`group-${group.sessionId}`} className="flex flex-col">
            {/* 1. Session Group Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                <FolderGit2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] shrink-0" />
                <span
                  className="font-bold text-xs text-slate-800 dark:text-stone-200 truncate max-w-[135px]"
                  title={group.sessionTitle || 'Phiên chưa đặt tên'}
                >
                  {group.sessionTitle || 'Phiên chưa đặt tên'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-stone-400 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                  {group.totalFiles} bản
                </span>
              </div>

              {/* Quick switch button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSwitchSession(group.sessionId);
                }}
                title={isCurrentActiveSession ? 'Đang mở trong Workspace' : 'Mở dự án này trong Workspace'}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer shrink-0 border',
                  isCurrentActiveSession
                    ? 'bg-amber-500/15 text-amber-900 dark:text-[#D4AF37] border-amber-500/30 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-stone-300 border-slate-200 dark:border-slate-700 hover:text-navy-900 dark:hover:text-white hover:border-amber-400 hover:bg-amber-500/5'
                )}
              >
                <span>{isCurrentActiveSession ? 'Đang mở' : 'Mở dự án'}</span>
                <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-[#D4AF37]" />
              </button>
            </div>

            {/* 2. File Versions List within Session (Sorted latest on top) */}
            <div className="space-y-1.5 pl-1">
              {group.files.map((file: StorageFileVersionItem) => {
                const isDeleting = deletingStorageId === file.id;

                return (
                  <div
                    key={`file-${file.id}`}
                    onClick={() =>
                      onSelectFile({
                        ...file,
                        sessionTitle: group.sessionTitle,
                      })
                    }
                    className={cn(
                      'group relative flex items-center justify-between p-2.5 rounded-xl border text-xs transition cursor-pointer shadow-xs',
                      file.isActive
                        ? 'bg-amber-500/[0.04] dark:bg-[#1E3E62]/30 border-amber-500/40 dark:border-[#D4AF37]/40 hover:border-amber-500 hover:shadow-sm'
                        : 'bg-white dark:bg-[#0F1D32] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-[#152744]'
                    )}
                  >
                    {/* Left: File metadata */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition',
                          file.isActive
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-[#D4AF37]'
                            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-stone-400'
                        )}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        {/* Filename + Version Badge + [Đang dùng] Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'font-mono font-bold text-xs truncate max-w-[110px]',
                              file.isActive
                                ? 'text-navy-900 dark:text-amber-300 font-extrabold'
                                : 'text-slate-800 dark:text-stone-200'
                            )}
                            title={file.fileName}
                          >
                            {file.fileName}
                          </span>

                          {/* Version Tag */}
                          <span
                            className={cn(
                              'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0',
                              file.isActive
                                ? 'bg-amber-500/15 text-amber-800 dark:text-[#D4AF37] border-amber-500/40'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-stone-400 border-slate-200 dark:border-slate-700'
                            )}
                          >
                            {file.version}
                          </span>

                          {/* Active Badge */}
                          {file.isActive && (
                            <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Đang dùng</span>
                            </span>
                          )}
                        </div>

                        {/* Subtitle: Session Title • Size */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-stone-400 mt-1">
                          <span className="truncate max-w-[95px]" title={group.sessionTitle}>
                            {group.sessionTitle}
                          </span>
                          <span>•</span>
                          <span className="font-mono font-medium text-slate-600 dark:text-stone-300 shrink-0">
                            {file.sizeFormatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1 shrink-0 bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-300 dark:border-red-500/40">
                        <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">Xóa?</span>
                        <button
                          type="button"
                          onClick={(e) => handleConfirmDelete(e, file.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-[11px] cursor-pointer ml-1"
                        >
                          Có
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingStorageId(null);
                          }}
                          className="text-slate-500 dark:text-stone-400 hover:text-slate-700 dark:hover:text-stone-200 text-[11px] cursor-pointer ml-1"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => onDownloadFile(e, file.id, file.fileName)}
                          title="Tải file HTML về máy"
                          className="p-1.5 text-slate-700 dark:text-stone-300 bg-slate-100 dark:bg-slate-800 hover:bg-[#D4AF37] hover:text-slate-950 rounded-lg transition cursor-pointer font-semibold border border-slate-200 dark:border-slate-700/60"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {onDeleteFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingStorageId(file.id);
                            }}
                            title="Xóa file khỏi kho"
                            className="p-1.5 text-slate-400 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. Session Group Separator (Đường phân cách theo Hình 1) */}
            {groupIndex < groups.length - 1 && (
              <div className="pt-3 pb-1">
                <div className="border-b border-dashed border-slate-300 dark:border-slate-800/90" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
