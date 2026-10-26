import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 select-none">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base md:text-sm min-h-[44px] text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-[#0B192C] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-navy-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
