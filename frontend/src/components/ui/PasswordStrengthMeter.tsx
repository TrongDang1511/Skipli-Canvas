import { FC } from 'react';
import { cn } from '../../utils/cn';
import { calculatePasswordStrength } from '../../utils/passwordStrength';

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
}

export const PasswordStrengthMeter: FC<PasswordStrengthMeterProps> = ({
  password = '',
  className,
}) => {
  if (!password || password.length === 0) {
    return null;
  }

  const strength = calculatePasswordStrength(password);

  return (
    <div className={cn('w-full space-y-1.5 pt-1 transition-all duration-300 select-none', className)}>
      {/* 4 Segmented Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < strength.score;
          return (
            <div
              key={index}
              className={cn(
                'h-full rounded-full transition-all duration-300',
                isFilled ? strength.barColor : 'bg-slate-200'
              )}
            />
          );
        })}
      </div>

      {/* Text Label & Contextual Hint */}
      <div className="flex items-center justify-between text-[11px] leading-tight">
        <span className="text-slate-600">
          Strength:{' '}
          <strong className={cn('font-bold tracking-tight', strength.textColor)}>
            {strength.label}
          </strong>
        </span>

        {strength.hint && (
          <span className="text-slate-500 text-[10px] truncate max-w-[200px]">
            {strength.hint}
          </span>
        )}
      </div>
    </div>
  );
};
