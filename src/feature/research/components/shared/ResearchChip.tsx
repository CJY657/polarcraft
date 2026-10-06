/**
 * Research chip — notebook badge primitive (counts, statuses, tags).
 * 课题组徽标：统一的 research-chip 外观小型标签。
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/classNames';

export function ResearchChip({
  children,
  accent = false,
  className,
  ...rest
}: { children: ReactNode; accent?: boolean } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'research-chip inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        accent && 'research-chip-accent font-semibold',
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
