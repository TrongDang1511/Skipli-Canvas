import { FC, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';
import {
  X,
  RotateCcw,
  MessageSquareX,
  HardDriveDownload,
  ImageOff,
  Loader2,
  FileCode2,
} from 'lucide-react';

interface RollbackWarningModalProps {
  isOpen: boolean;
  promptText: string;
  deletedMessagesCount: number;
  deletedVersions: string[];
  isSubmitting: boolean;
  mode?: 'prompt' | 'milestone';
  milestoneVersion?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const RollbackWarningModal: FC<RollbackWarningModalProps> = ({
  isOpen,
  promptText,
  deletedMessagesCount,
  deletedVersions,
  isSubmitting,
  mode = 'prompt',
  milestoneVersion,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isMilestone = mode === 'milestone';

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200 select-none animate-in fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-200',
          'bg-white border-slate-200 text-slate-800',
          'dark:bg-[#0B192C] dark:border-slate-800 dark:text-stone-100'
        )}
      >
        {/* 1. Header: Clean title + Close button */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070F1E]">
          <div className="flex flex-col">
            <h3 className="font-bold text-sm text-navy-900 dark:text-white tracking-tight">
              {isMilestone
                ? `Confirm Revert ${milestoneVersion ? `(${milestoneVersion})` : 'to Milestone'}`
                : 'Confirm Rollback'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5">
              Confirming rollback will apply the following changes:
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-stone-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Body: Flat, scannable list like IDE Git undo changes */}
        <div className="p-5 space-y-2.5 text-xs">
          {/* Item 1: Lịch sử trò chuyện */}
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-600 dark:text-stone-300">
              <MessageSquareX className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-medium">Conversation History</span>
            </div>
            <span className="font-bold text-red-600 dark:text-red-400 font-mono text-[11px]">
              Remove {deletedMessagesCount} message{deletedMessagesCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Item 2: Phiên bản Cloud Storage */}
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-600 dark:text-stone-300">
              <HardDriveDownload className="w-4 h-4 text-amber-500 dark:text-[#D4AF37] shrink-0" />
              <span className="font-medium">Cloud Storage Versions</span>
            </div>
            <span className="font-mono font-bold text-amber-700 dark:text-[#D4AF37] text-[11px]">
              {deletedVersions.length > 0 ? `Discard ${deletedVersions.join(', ')}` : 'Discard subsequent versions'}
            </span>
          </div>

          {/* Item 3: Dọn dẹp tài nguyên ảnh kèm theo */}
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-600 dark:text-stone-300">
              <ImageOff className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">Attached Assets</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-stone-500">
              Auto-cleanup
            </span>
          </div>

          {/* Item 4: Khôi phục prompt (Chỉ hiển thị khi rollback từ User Prompt) */}
          {!isMilestone && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center gap-2 text-slate-600 dark:text-stone-300">
                <FileCode2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium">Restore prompt text:</span>
              </div>
              <p className="text-xs text-navy-900 dark:text-white italic line-clamp-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
                "{promptText}"
              </p>
            </div>
          )}
        </div>

        {/* 3. Footer: Simple Action Buttons */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070F1E] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-amber-400 text-slate-950 dark:bg-[#1E3E62] dark:hover:bg-[#28507e] dark:text-[#D4AF37] border border-amber-400/60 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>{isMilestone ? 'Confirm Revert' : 'Confirm Rollback ↵'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
