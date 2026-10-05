import { ButtonHTMLAttributes, ReactNode, FC } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'navy' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'navy',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    navy: 'bg-navy-900 hover:bg-navy-800 text-white focus:ring-navy-900 shadow-sm active:scale-[0.99]',
    gold: 'bg-gold-400 hover:bg-gold-500 text-navy-950 font-semibold focus:ring-gold-400 shadow-sm shadow-gold-400/20 active:scale-[0.99]',
    outline: 'border border-navy-200 hover:border-navy-900 text-navy-900 bg-white hover:bg-beige-50 focus:ring-navy-900',
    ghost: 'text-navy-700 hover:text-navy-950 hover:bg-beige-100 focus:ring-navy-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base font-semibold'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xử lý...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
