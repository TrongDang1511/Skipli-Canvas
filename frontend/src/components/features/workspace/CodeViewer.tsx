import { FC, useState, useEffect } from 'react';
import { ViewMode } from '../../../types/chat.types';
import { cn } from '../../../utils/cn';
import { Copy, Check, FileCode, Eye, Code2, Loader2, FileQuestion } from 'lucide-react';

interface CodeViewerProps {
  code?: string;
  presignedUrl?: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const CodeViewer: FC<CodeViewerProps> = ({ code: propCode, presignedUrl, viewMode, setViewMode }) => {
  const [copied, setCopied] = useState(false);
  const [fetchedCode, setFetchedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!propCode && presignedUrl) {
      setIsLoading(true);
      setHasError(false);
      fetch(presignedUrl)
        .then(async (res) => {
          if (!res.ok) {
            setHasError(true);
            return;
          }
          const text = await res.text();
          if (text.includes('<Error>') && text.includes('<Code>NoSuchKey</Code>')) {
            setHasError(true);
          } else {
            setFetchedCode(text);
          }
        })
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    }
  }, [propCode, presignedUrl]);

  const activeCode = propCode || fetchedCode;
  const lines = activeCode ? activeCode.split('\n') : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <main className="flex-1 bg-[#FAF9F6] dark:bg-[#070F1E] text-slate-800 dark:text-stone-100 flex flex-col h-full overflow-hidden p-3 select-none transition-colors duration-200">
      {/* 1. Header Bar */}
      <div className="h-10 bg-white dark:bg-[#0B192C] border border-slate-200/90 dark:border-slate-800 rounded-lg px-4 flex items-center justify-between text-xs mb-2 shrink-0 shadow-xs dark:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-500 dark:text-[#D4AF37]" />
            <span className="font-semibold text-slate-800 dark:text-stone-200">index.html</span>
            <span className="text-[10px] text-slate-500 dark:text-stone-400 bg-slate-100 dark:bg-[#112240] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
              {lines.length} dòng ({new Blob([activeCode]).size} bytes)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* View Mode Toggle: Xem Trước / Mã Nguồn */}
          <div className="flex items-center bg-slate-100 dark:bg-[#112240] p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
                viewMode === 'preview'
                  ? 'bg-white dark:bg-[#1E3E62] text-navy-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Eye className="w-3 h-3 text-amber-500 dark:text-[#D4AF37]" />
              <span>Xem Trước</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer',
                viewMode === 'code'
                  ? 'bg-white dark:bg-[#1E3E62] text-navy-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Code2 className="w-3 h-3 text-amber-500 dark:text-[#D4AF37]" />
              <span>Mã Nguồn</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-stone-200 hover:text-navy-900 dark:hover:text-white rounded-lg transition text-xs font-medium border border-slate-200 dark:border-white/10 cursor-pointer active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37]" />
              <span>Sao chép mã</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Code Body with Line Numbers */}
      <div className="flex-1 bg-white dark:bg-[#070F1E] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-auto p-4 font-mono text-xs leading-relaxed select-text shadow-xs relative">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 select-none">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-sans">Đang tải mã nguồn...</span>
          </div>
        ) : hasError ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none bg-[#FAF9F6] dark:bg-[#081220] rounded-lg border border-slate-200 dark:border-slate-800">
            <FileQuestion className="w-12 h-12 text-amber-500 dark:text-[#D4AF37] mb-3" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-stone-200 mb-1 font-sans">
              Không Thể Nạp Mã Nguồn
            </h4>
            <p className="text-xs text-slate-500 dark:text-stone-400 font-sans max-w-sm">
              Tệp HTML của phiên bản này không còn tồn tại trên hệ thống lưu trữ.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <td className="w-12 text-right pr-4 text-slate-400 dark:text-stone-600 select-none text-[11px] font-mono align-top">
                    {idx + 1}
                  </td>
                  <td className="text-slate-800 dark:text-stone-300 whitespace-pre font-mono align-top">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};
