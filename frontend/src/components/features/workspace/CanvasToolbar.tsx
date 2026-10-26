import { FC } from 'react';
import { ViewportMode, ViewMode } from '../../../types/chat.types';
import { CanvasEditorMode } from '../../../types/editor.types';
import { cn } from '../../../utils/cn';
import {
  RotateCw,
  ExternalLink,
  Globe,
  Loader2,
  Eye,
  PenTool,
  Save,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Layers,
  Undo2,
  Redo2,
} from 'lucide-react';

interface CanvasToolbarProps {
  // View mode (Preview vs Code)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Editor mode (Live Preview vs Visual Edit)
  editorMode: CanvasEditorMode;
  setEditorMode: (mode: CanvasEditorMode) => void;

  // Section Drawer
  isSectionDrawerOpen?: boolean;
  onToggleSectionDrawer?: () => void;

  // Undo / Redo
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  lastUndoLabel?: string | null;
  lastRedoLabel?: string | null;
  onUndo?: () => void;
  onRedo?: () => void;

  // Save changes
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;

  // Viewport
  viewport: ViewportMode;
  setViewport: (mode: ViewportMode) => void;

  // Actions
  onRefresh: () => void;
  isCheckingS3: boolean;
  onOpenNewTab: () => void;
  onExport: () => void;
  hasStorageError: boolean;
  presignedUrl?: string;
  isStreaming: boolean;
}

export const CanvasToolbar: FC<CanvasToolbarProps> = ({
  viewMode,
  setViewMode,
  editorMode,
  setEditorMode,
  // Section Drawer
  isSectionDrawerOpen,
  onToggleSectionDrawer,
  // Undo / Redo
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  redoCount = 0,
  lastUndoLabel,
  lastRedoLabel,
  onUndo,
  onRedo,
  // Save changes
  isDirty,
  isSaving,
  onSave,
  viewport,
  setViewport,
  onRefresh,
  isCheckingS3,
  onOpenNewTab,
  onExport,
  hasStorageError,
  presignedUrl,
  isStreaming,
}) => {
  return (
    <div className="h-10 bg-white dark:bg-[#0B192C] border border-slate-200/90 dark:border-slate-800 rounded-lg px-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-stone-300 mb-2 shrink-0 shadow-xs dark:shadow-md min-w-0 gap-2 transition-colors duration-200">
      {/* Cụm trái: Điều khiển chế độ & Viewport */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRefresh}
          title="Reload preview"
          disabled={isCheckingS3}
          className="p-1 text-slate-400 hover:text-slate-800 dark:text-stone-400 dark:hover:text-white rounded transition cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={cn('w-3.5 h-3.5 stroke-[1.75]', isCheckingS3 && 'animate-spin text-[#D4AF37]')} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* 1. Bộ chuyển đổi: [👁️ Preview] vs [✏️ Visual Edit] vs [💻 Code] */}
        <div className="flex items-center bg-slate-100 dark:bg-[#112240] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              setEditorMode('preview');
            }}
            title="Interactive Preview: Test links, buttons, cart drawers, modals, and tabs"
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
              viewMode === 'preview' && editorMode === 'preview'
                ? 'bg-white dark:bg-[#1E3E62] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Eye className="w-3 h-3 stroke-[1.75] text-[#D4AF37]" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('preview');
              setEditorMode('visual_edit');
            }}
            title="Visual Editor: Click any element, text, button, or image to edit"
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
              viewMode === 'preview' && editorMode === 'visual_edit'
                ? 'bg-[#0B192C] text-[#D4AF37] dark:bg-[#1E3E62] dark:text-[#D4AF37] shadow-xs font-bold ring-1 ring-[#D4AF37]/50'
                : 'text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <PenTool className="w-3 h-3 stroke-[1.75] text-[#D4AF37]" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('code')}
            title="View HTML Source Code"
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
              viewMode === 'code'
                ? 'bg-white dark:bg-[#1E3E62] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Code2 className="w-3 h-3 stroke-[1.75] text-slate-500 dark:text-stone-400" />
            <span className="hidden md:inline">Code</span>
          </button>
        </div>

        {/* Nút Cấu Trúc Khối (Section Navigator) */}
        {editorMode === 'visual_edit' && onToggleSectionDrawer && (
          <button
            type="button"
            onClick={onToggleSectionDrawer}
            title="View and reorder layout sections"
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border',
              isSectionDrawerOpen
                ? 'bg-[#0B192C] text-[#D4AF37] dark:bg-[#1E3E62] dark:text-[#D4AF37] border-[#D4AF37]/60 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-slate-700 hover:text-slate-950 dark:hover:text-white'
            )}
          >
            <Layers className="w-3.5 h-3.5 stroke-[1.75] text-[#D4AF37]" />
            <span className="hidden sm:inline">Sections</span>
          </button>
        )}

        {/* Nút Hoàn Tác & Làm Lại (Undo / Redo) */}
        {editorMode === 'visual_edit' && (
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#112240] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title={canUndo ? `Undo: ${lastUndoLabel || 'Previous action'} (Ctrl+Z)` : 'Nothing to undo (Ctrl+Z)'}
              className={cn(
                'flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
                canUndo
                  ? 'text-slate-700 dark:text-stone-200 hover:bg-white dark:hover:bg-[#1E3E62] hover:text-slate-950 dark:hover:text-white shadow-xs'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              )}
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[1.75]" />
              {undoCount > 0 && (
                <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-500/20 text-amber-700 dark:text-[#D4AF37] rounded-full">
                  {undoCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title={canRedo ? `Redo: ${lastRedoLabel || 'Previous undone action'} (Ctrl+Y)` : 'Nothing to redo (Ctrl+Y)'}
              className={cn(
                'flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
                canRedo
                  ? 'text-slate-700 dark:text-stone-200 hover:bg-white dark:hover:bg-[#1E3E62] hover:text-slate-950 dark:hover:text-white shadow-xs'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              )}
            >
              <Redo2 className="w-3.5 h-3.5 stroke-[1.75]" />
              {redoCount > 0 && (
                <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-500/20 text-amber-700 dark:text-[#D4AF37] rounded-full">
                  {redoCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* 2. Nút Lưu Thay Đổi (Hiển thị khi ở chế độ Chỉnh Sửa) */}
        {editorMode === 'visual_edit' && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            title={isDirty ? 'Save changes (Ctrl+S)' : 'All changes saved'}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border',
              isDirty
                ? 'bg-[#1E3E62] hover:bg-[#28507e] text-white border-[#16304d] dark:bg-[#1E3E62] dark:hover:bg-[#28507e] dark:border-blue-400/30 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 stroke-[1.75] animate-spin text-[#D4AF37]" />
            ) : (
              <Save className="w-3 h-3 stroke-[1.75] text-[#D4AF37] dark:text-amber-300" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            <kbd className={cn(
              'text-[9px] font-medium px-1 py-0.2 rounded border transition',
              isDirty
                ? 'bg-white/15 border-white/25 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            )}>
              Ctrl+S
            </kbd>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] dark:bg-amber-400 ml-0.5 animate-pulse" />}
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* 3. Bộ chọn Viewport */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#112240] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            title="Desktop"
            className={cn(
              'p-1.5 rounded-md transition cursor-pointer',
              viewport === 'desktop'
                ? 'bg-white dark:bg-[#1E3E62] text-slate-900 dark:text-[#D4AF37] shadow-xs'
                : 'text-slate-400 dark:text-stone-400 hover:text-slate-700 dark:hover:text-white'
            )}
          >
            <Monitor className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            title="Tablet"
            className={cn(
              'p-1.5 rounded-md transition cursor-pointer',
              viewport === 'tablet'
                ? 'bg-white dark:bg-[#1E3E62] text-slate-900 dark:text-[#D4AF37] shadow-xs'
                : 'text-slate-400 dark:text-stone-400 hover:text-slate-700 dark:hover:text-white'
            )}
          >
            <Tablet className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            title="Mobile"
            className={cn(
              'p-1.5 rounded-md transition cursor-pointer',
              viewport === 'mobile'
                ? 'bg-white dark:bg-[#1E3E62] text-slate-900 dark:text-[#D4AF37] shadow-xs'
                : 'text-slate-400 dark:text-stone-400 hover:text-slate-700 dark:hover:text-white'
            )}
          >
            <Smartphone className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* Cụm giữa: Địa chỉ URL giả lập */}
      <div className="hidden lg:flex flex-1 max-w-[200px] xl:max-w-xs min-w-0 mx-2 bg-slate-100 dark:bg-[#112240] border border-slate-200 dark:border-slate-700/80 rounded-md px-2.5 py-1 items-center gap-1.5 text-[11px] text-slate-700 dark:text-stone-300 font-mono">
        <Globe className="w-3 h-3 stroke-[1.75] text-[#D4AF37] shrink-0" />
        <span className="truncate">https://preview.skipli-canvas.app/landing-page</span>
        {isStreaming && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-[#D4AF37] font-sans font-medium shrink-0">
            <Loader2 className="w-3 h-3 stroke-[1.75] animate-spin text-[#D4AF37]" />
            <span className="hidden 2xl:inline">Generating...</span>
          </span>
        )}
      </div>

      {/* Cụm phải: Toàn màn hình & Tải HTML */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <button
          onClick={onOpenNewTab}
          disabled={!presignedUrl || hasStorageError}
          title="Open in new tab (Full screen)"
          className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white font-medium transition cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="hidden md:inline">Full Screen</span>
          <ExternalLink className="w-3.5 h-3.5 stroke-[1.75] text-slate-400 dark:text-stone-400" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        <button
          onClick={onExport}
          disabled={!presignedUrl}
          title="Download HTML file"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#1E3E62] hover:bg-[#28507e] text-white dark:bg-[#1E3E62] dark:hover:bg-[#28507e] dark:border dark:border-blue-400/30 rounded-md font-semibold text-[11px] transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 stroke-[1.75] text-[#D4AF37] dark:text-amber-300" />
          <span>Export HTML</span>
        </button>
      </div>
    </div>
  );
};
