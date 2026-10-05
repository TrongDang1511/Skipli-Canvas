import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility helper kết hợp clsx và tailwind-merge để gộp Tailwind class linh hoạt, sạch đẹp, tránh trùng lặp
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
