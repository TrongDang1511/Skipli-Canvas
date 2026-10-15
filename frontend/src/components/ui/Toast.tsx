import { FC, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  isOpen: boolean;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: FC<ToastProps> = ({
  isOpen,
  type = 'success',
  title,
  message,
  duration = 3500,
  onClose,
}) => {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    const intervalTime = 20;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 stroke-[2] text-[#D4AF37] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 stroke-[2] text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 stroke-[2] text-[#1E3E62] dark:text-[#D4AF37] shrink-0" />;
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-fadeIn select-none pointer-events-auto">
      <div className="bg-[#FAF9F6] dark:bg-[#0B192C] text-slate-900 dark:text-stone-100 border border-[#D4AF37]/50 dark:border-[#D4AF37]/40 rounded-xl shadow-2xl p-3.5 flex flex-col overflow-hidden relative backdrop-blur-xs transition-colors">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0 pr-2">
            {title && (
              <h4 className="text-xs font-bold text-slate-950 dark:text-white tracking-tight">
                {title}
              </h4>
            )}
            <p className="text-xs text-slate-600 dark:text-stone-300 font-medium leading-relaxed mt-0.5 font-sans">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>

        {/* Thanh đếm thời gian mượt mà dưới đáy */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200/50 dark:bg-slate-800">
          <div
            style={{ width: `${progress}%` }}
            className={cn(
              'h-full transition-all duration-75',
              type === 'error' ? 'bg-rose-500' : 'bg-[#D4AF37]'
            )}
          />
        </div>
      </div>
    </div>
  );
};
