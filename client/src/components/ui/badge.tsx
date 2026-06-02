import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--primary)] text-white',
  secondary: 'bg-[var(--secondary)] text-white',
  success: 'bg-[var(--success)] text-white',
  warning: 'bg-[var(--warning)]/20 text-[var(--warning-dark)]',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger-dark)]',
  outline: 'border border-black/15 bg-white text-[var(--primary)]',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
