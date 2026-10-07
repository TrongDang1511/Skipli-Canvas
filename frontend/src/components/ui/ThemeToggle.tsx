import { FC, MouseEvent } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title={isDark ? 'Chuyển sang Chế độ Sáng (Light Mode)' : 'Chuyển sang Chế độ Tối (Dark Mode)'}
      className={cn(
        'relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border shadow-xs cursor-pointer select-none active:scale-95 z-30',
        isDark
          ? 'bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-slate-800 hover:border-amber-400'
          : 'bg-white border-slate-300 text-navy-900 hover:bg-slate-50 hover:border-amber-500/50 shadow-xs',
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <Sun
          className={cn(
            'w-4 h-4 text-amber-500 transition-all duration-300 transform',
            isDark ? 'opacity-0 rotate-90 scale-50 absolute' : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <Moon
          className={cn(
            'w-4 h-4 text-amber-300 transition-all duration-300 transform',
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50 absolute'
          )}
        />
      </div>
      <span className="font-semibold text-xs tracking-wide">
        {showLabel ? (isDark ? 'Chế độ Tối' : 'Chế độ Sáng') : (isDark ? 'Tối' : 'Sáng')}
      </span>
    </button>
  );
};
