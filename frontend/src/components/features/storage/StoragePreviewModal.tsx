import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StorageFileItem, StorageFileVersionItem } from '../../../types/storage.types';
import { cn } from '../../../utils/cn';
import {
  X,
  Download,
  ExternalLink,
  Code2,
  HardDrive,
  Sparkles,
  Loader2,
} from 'lucide-react';

export type StoragePreviewableItem = (StorageFileItem | StorageFileVersionItem) & {
  sessionTitle?: string;
};

interface StoragePreviewModalProps {
  file: StoragePreviewableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (fileId: string, fileName: string, versionId?: string) => Promise<void>;
}

export const StoragePreviewModal: FC<StoragePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [isLoadingIframe, setIsLoadingIframe] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingIframe(true);
    }
  }, [isOpen, file?.presignedUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      const targetVersionId = 'versionId' in file ? file.versionId : undefined;
      await onDownload(file.id, file.fileName, targetVersionId);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-[95vw] max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-colors duration-200',
          'bg-[#FAF9F6] border-slate-300/90 text-slate-900',
          'dark:bg-[#081220] dark:border-slate-800 dark:text-stone-100'
        )}
      >
        {/* 1. Modal Top Bar (Light Luxury Theme Header) */}
        <div className="h-14 px-5 flex items-center justify-between bg-white dark:bg-[#070F1E] border-b border-amber-500/30 text-slate-900 dark:text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs md:max-w-md">
                  {file.fileName}
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
                  {file.version}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                <span className="truncate max-w-[150px]">{file.sessionTitle}</span>
                <span>•</span>
                <span className="font-mono text-amber-700 dark:text-amber-300 font-semibold">{formatFileSize(file.sizeBytes)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {file.presignedUrl && (
              <a
                href={file.presignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open in New Tab</span>
              </a>
            )}

            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              title="Download HTML file directly from Cloud Storage"
              className="py-2 px-3.5 bg-[#1E3E62] hover:bg-[#28507e] text-white dark:bg-[#1E3E62] dark:hover:bg-[#28507e] font-bold text-xs rounded-xl shadow-xs border border-[#16304d] dark:border-blue-400/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              ) : (
                <Download className="w-4 h-4 text-[#D4AF37] dark:text-amber-300" />
              )}
              <span>Download HTML</span>
            </button>

            <button
              onClick={onClose}
              title="Close"
              className="p-2 text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Modal Body (Iframe Preview) */}
        <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
          {isLoadingIframe && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-[#081220]/80 backdrop-blur-xs">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
              <p className="text-xs font-medium text-slate-700 dark:text-stone-300">
                Loading quick preview from Cloud Storage...
              </p>
            </div>
          )}

          {file.presignedUrl ? (
            <iframe
              src={file.presignedUrl}
              title={file.fileName}
              onLoad={() => setIsLoadingIframe(false)}
              className="w-full h-full border-0 shadow-inner"
              sandbox="allow-scripts allow-same-origin allow-modals allow-[#D4AF37]"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-stone-400 p-8 text-center">
              <HardDrive className="w-12 h-12 text-slate-400 mb-3" />
              <p className="font-semibold text-sm">Unable to load preview link</p>
              <p className="text-xs text-slate-400 mt-1">
                The preview link may have expired or is unavailable. Please try again later!
              </p>
            </div>
          )}
        </div>

        {/* 3. Modal Footer Bar */}
        <div className="h-10 px-5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#070F1E] text-[11px] text-slate-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Isolated Quick Preview • Does not interrupt active session</span>
          </div>
          <span className="font-mono text-[10px]">Skipli Cloud Storage</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
