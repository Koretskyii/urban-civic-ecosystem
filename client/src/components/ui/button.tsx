import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] shadow-sm',
  secondary:
    'bg-[var(--secondary)] text-white hover:bg-[var(--secondary-dark)] shadow-sm',
  danger:
    'bg-[var(--danger)] text-white hover:bg-[var(--danger-dark)] shadow-sm',
  ghost: 'bg-transparent text-[var(--primary)] hover:bg-black/5',
  outline:
    'border border-black/15 bg-white text-[var(--primary)] hover:bg-[var(--secondary)]/10',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--secondary)]/25 disabled:pointer-events-none disabled:opacity-60',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
