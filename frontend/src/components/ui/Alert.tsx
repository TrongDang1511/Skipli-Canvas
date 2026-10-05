import { ReactNode, FC } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps {
  type?: 'error' | 'success' | 'info';
  message: ReactNode;
  className?: string;
}

export const Alert: FC<AlertProps> = ({ type = 'error', message, className }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-navy-50 border-navy-200 text-navy-800'
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-navy-600 shrink-0" />
  };

  return (
    <div className={cn('flex items-start gap-2.5 p-3 rounded-lg border text-xs font-medium', styles[type], className)}>
      {icons[type]}
      <div className="flex-1">{message}</div>
    </div>
  );
};
