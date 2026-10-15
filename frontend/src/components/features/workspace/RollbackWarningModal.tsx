import { FC, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';
import {
  AlertTriangle,
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
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const RollbackWarningModal: FC<RollbackWarningModalProps> = ({
  isOpen,
  promptText,
  deletedMessagesCount,
  deletedVersions,
  isSubmitting,
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
          'w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-200',
          'bg-[#FAF9F6] border-slate-300/90 text-slate-800',
          'dark:bg-[#0B192C] dark:border-slate-800 dark:text-stone-100'
        )}
      >
        {/* 1. Header: Alert Title */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/[0.06] dark:bg-[#070F1E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-[#D4AF37] border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-white tracking-tight">
                Xác Nhận Khôi Phục & Sửa Prompt
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-stone-400">
                Hệ thống sẽ quay về trạng thái trước lượt chat này
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            title="Đóng"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-stone-400 dark:hover:text-white rounded-lg transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Body: 3 Transparent Risk Bullet Points + Preview Prompt */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-stone-300 font-medium">
            Khi thực hiện quay lại bước này, các dữ liệu sau sẽ được hoàn tác và dọn dẹp:
          </p>

          <div className="space-y-2.5">
            {/* Risk 1: Deleted Messages */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/20 dark:bg-red-950/30 dark:border-red-500/30">
              <div className="w-6 h-6 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquareX className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-stone-200">
                  Lịch sử hội thoại sẽ bị cắt bỏ
                </div>
                <div className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5">
                  Sẽ xóa vĩnh viễn <span className="font-bold text-red-600 dark:text-red-400">{deletedMessagesCount}</span> tin nhắn chat từ lượt này trở đi.
                </div>
              </div>
            </div>

            {/* Risk 2: Deleted S3 Version Files */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 dark:bg-amber-950/20 dark:border-amber-500/30">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                <HardDriveDownload className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-stone-200">
                  Phiên bản Cloud Storage bị hủy
                </div>
                <div className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5">
                  {deletedVersions.length > 0 ? (
                    <span>
                      Các file mã nguồn <span className="font-mono font-bold text-amber-700 dark:text-[#D4AF37]">{deletedVersions.join(', ')}</span> trên MinIO S3 sẽ bị xóa vĩnh viễn.
                    </span>
                  ) : (
                    <span>Mã nguồn của các bước phát sinh phía sau sẽ được xóa sạch khỏi kho lưu trữ.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Risk 3: Resource Clean Up */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-stone-400 flex items-center justify-center shrink-0 mt-0.5">
                <ImageOff className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-stone-200">
                  Dọn dẹp ảnh & tài nguyên kèm theo
                </div>
                <div className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5">
                  Toàn bộ ảnh hoặc tài nguyên sinh ra ở các bước sau cũng sẽ được dọn dẹp để tránh lãng phí dung lượng.
                </div>
              </div>
            </div>
          </div>

          {/* Preview: Prompt sắp sửa */}
          <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#112240] border border-slate-200/90 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-stone-400 mb-1">
              <FileCode2 className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37]" />
              <span>Nội dung câu prompt sẽ được điền lại vào ô chat:</span>
            </div>
            <p className="text-xs text-navy-900 dark:text-white italic line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
              "{promptText}"
            </p>
          </div>
        </div>

        {/* 3. Footer: Action Buttons */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#070F1E] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-amber-400 text-slate-950 dark:bg-[#1E3E62] dark:hover:bg-[#28507e] dark:text-[#D4AF37] border border-amber-400/60 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950 dark:text-[#D4AF37]" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 text-slate-950 dark:text-[#D4AF37]" />
            )}
            <span>Xác Nhận & Sửa Prompt</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
