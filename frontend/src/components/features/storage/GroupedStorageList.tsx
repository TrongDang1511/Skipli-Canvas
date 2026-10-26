import { FC, useState, MouseEvent } from 'react';
import { GroupedSessionStorageItem } from '../../../types/storage.types';
import { StoragePreviewableItem } from './StoragePreviewModal';
import { cn } from '../../../utils/cn';
import {
  FolderGit2,
  Code2,
  Download,
  Layers,
  ArrowUpRight,
  ChevronDown,
  GitCommit,
} from 'lucide-react';

interface GroupedStorageListProps {
  groups: GroupedSessionStorageItem[];
  activeSessionId?: string | null;
  onSelectFile: (file: StoragePreviewableItem) => void;
  onDownloadFile: (e: MouseEvent, fileId: string, fileName: string, versionId?: string) => void;
  onQuickSwitchSession: (sessionId: string) => void;
  onDeleteFile?: (fileId: string) => Promise<void> | void;
}

export const GroupedStorageList: FC<GroupedStorageListProps> = ({
  groups,
  activeSessionId,
  onSelectFile,
  onDownloadFile,
  onQuickSwitchSession,
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  if (!groups || groups.length === 0) {
    return (
      <div className="py-12 px-4 text-center text-slate-400 dark:text-stone-500 text-xs">
        <Layers className="w-8 h-8 mx-auto mb-2.5 text-slate-400/60 dark:text-stone-500/60 stroke-[1.5]" />
        <p className="font-semibold text-slate-700 dark:text-stone-300">No HTML source files found</p>
        <p className="text-[11px] text-slate-400 dark:text-stone-500 mt-1">
          HTML versions generated from each session will be grouped and stored here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 select-none">
      {groups.map((group, groupIndex) => {
        const isCurrentActiveSession = group.sessionId === activeSessionId;
        const activeOrLatestFile = group.files.find((f) => f.isActive) || group.files[0];
        const isExpanded = Boolean(expandedSessions[group.sessionId]);
        const hasMultipleVersions = group.files.length > 1;

        return (
          <div key={`group-${group.sessionId}`} className="flex flex-col">
            {/* 1. Session Group Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                <FolderGit2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] shrink-0" />
                <span
                  className="font-bold text-xs text-slate-800 dark:text-stone-200 truncate max-w-[120px] sm:max-w-[220px]"
                  title={group.sessionTitle || 'Untitled Project'}
                >
                  {group.sessionTitle || 'Untitled Project'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-stone-400 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                  {group.totalFiles} versions
                </span>
              </div>

              {/* Quick switch button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSwitchSession(group.sessionId);
                }}
                title={isCurrentActiveSession ? 'Open in Workspace' : 'Open project in Workspace'}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer shrink-0 border',
                  isCurrentActiveSession
                    ? 'bg-amber-500/15 text-amber-900 dark:text-[#D4AF37] border-amber-500/30 font-bold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-stone-300 border-slate-200 dark:border-slate-700 hover:text-navy-900 dark:hover:text-white hover:border-amber-400 hover:bg-amber-500/5'
                )}
              >
                <span>{isCurrentActiveSession ? 'Active' : 'Open'}</span>
                <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-[#D4AF37]" />
              </button>
            </div>

            {/* 2. File index.html Đại Diện (Bản mới nhất / Đang active) */}
            {activeOrLatestFile && (
              <div className="pl-1">
                <div
                  onClick={() =>
                    onSelectFile({
                      ...activeOrLatestFile,
                      sessionTitle: group.sessionTitle,
                    })
                  }
                  className={cn(
                    'group relative flex items-center justify-between p-2 rounded-xl border text-xs transition cursor-pointer shadow-xs',
                    activeOrLatestFile.isActive
                      ? 'bg-amber-500/[0.04] dark:bg-[#1E3E62]/30 border-amber-500/40 dark:border-[#D4AF37]/40 hover:border-amber-500 hover:shadow-sm'
                      : 'bg-white dark:bg-[#0F1D32] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-[#152744]'
                  )}
                >
                  {/* Left: Metadata bản mới nhất */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition',
                        activeOrLatestFile.isActive
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-[#D4AF37]'
                          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-stone-400'
                      )}
                    >
                      <Code2 className="w-3 h-3" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      {/* HÀNG 1: Toàn bộ tags nhỏ gọn trên cùng 1 hàng duy nhất */}
                      <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
                        <span
                          className={cn(
                            'font-mono font-bold text-xs shrink-0',
                            activeOrLatestFile.isActive
                              ? 'text-navy-900 dark:text-amber-300 font-extrabold'
                              : 'text-slate-800 dark:text-stone-200'
                          )}
                          title="index.html"
                        >
                          index.html
                        </span>

                        {/* Version Badge */}
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-800 dark:text-[#D4AF37] border border-amber-500/40 shrink-0">
                          {activeOrLatestFile.version.replace(/\s*\([^)]*\)/g, '').trim()}
                        </span>

                        {/* Active Badge nhỏ */}
                        {activeOrLatestFile.isActive && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      {/* HÀNG 2: Dung lượng & số lượng bản */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-stone-300 font-medium mt-0.5">
                        <span className="font-mono font-semibold text-slate-700 dark:text-stone-200">
                          {activeOrLatestFile.sizeFormatted}
                        </span>
                        <span>•</span>
                        <span>{group.totalFiles} versions</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Nút Download + 1 Nút Dropdown Chevron duy nhất */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) =>
                        onDownloadFile(
                          e,
                          activeOrLatestFile.id,
                          activeOrLatestFile.fileName,
                          activeOrLatestFile.versionId
                        )
                      }
                      title="Download latest HTML file"
                      className="p-1.5 text-slate-700 dark:text-stone-300 bg-slate-100 dark:bg-slate-800 hover:bg-[#1E3E62] hover:text-white dark:hover:bg-[#28507e] rounded-lg transition cursor-pointer font-semibold border border-slate-200 dark:border-slate-700/60"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* 1 Nút Dropdown Chevron duy nhất */}
                    {hasMultipleVersions && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSessionExpand(group.sessionId);
                        }}
                        title={isExpanded ? 'Collapse version history' : 'View previous versions'}
                        className={cn(
                          'p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center',
                          isExpanded
                            ? 'bg-amber-500/20 text-amber-900 dark:text-[#D4AF37] border-amber-500/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-stone-300 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-navy-900'
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Danh sách sub-versions bên trong (Nhỏ gọn, chỉ hiện khi ấn dropdown, BỎ tag active) */}
                {isExpanded && hasMultipleVersions && (
                  <div className="ml-3 pl-2.5 border-l-2 border-amber-500/40 dark:border-amber-500/40 my-2 space-y-1 animate-in fade-in-50 duration-200">
                    <div className="text-[10px] font-bold text-slate-700 dark:text-stone-300 uppercase tracking-wider mb-1 px-1">
                      Version History ({group.totalFiles})
                    </div>
                    {group.files.map((file) => {
                      const cleanVersion = file.version.replace(/\s*\([^)]*\)/g, '').trim();

                      return (
                        <div
                          key={`sub-file-${file.id}`}
                          onClick={() =>
                            onSelectFile({
                              ...file,
                              version: cleanVersion,
                              sessionTitle: group.sessionTitle,
                            })
                          }
                          className={cn(
                            'group/sub flex items-center justify-between py-1 px-2 rounded-lg border text-xs transition cursor-pointer',
                            file.isActive
                              ? 'bg-amber-500/10 dark:bg-[#1E3E62]/40 border-amber-500/40 dark:border-[#D4AF37]/40 shadow-2xs font-semibold'
                              : 'bg-slate-50/70 dark:bg-[#0B1526]/80 border-slate-200/60 dark:border-slate-800/60 hover:bg-white dark:hover:bg-[#11213B] hover:border-slate-300'
                          )}
                        >
                          {/* Left: Compact info */}
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <GitCommit className="w-3 h-3 text-slate-500 dark:text-stone-400 shrink-0" />

                            {/* Version Tag */}
                            <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-stone-200 shrink-0 bg-white dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                              {cleanVersion}
                            </span>

                            {/* Source Type Badge */}
                            {file.type === 'manual' ? (
                              <span className="text-[9px] text-amber-700 dark:text-[#D4AF37] font-semibold shrink-0 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                                Manual
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-700 dark:text-stone-300 font-semibold shrink-0 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                AI
                              </span>
                            )}
                          </div>

                          {/* Right: Size & Small Download Button (Không có tag active làm chật chội) */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-stone-300">
                              {file.sizeFormatted}
                            </span>
                            <button
                              type="button"
                              onClick={(e) =>
                                onDownloadFile(e, file.id, file.fileName, file.versionId)
                              }
                              title={`Download version ${cleanVersion}`}
                              className="p-1 rounded text-slate-500 dark:text-stone-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Session Group Separator */}
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
