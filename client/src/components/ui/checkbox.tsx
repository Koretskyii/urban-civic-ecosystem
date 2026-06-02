'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  boxSize?: 'sm' | 'md' | 'lg';
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, boxSize = 'md', ...props }, ref) => {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSizeMap = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const dimension = sizeMap[boxSize];
  const iconSize = iconSizeMap[boxSize];

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer flex shrink-0 aspect-square items-center justify-center rounded-[4px] border border-black/30 bg-white p-0 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--secondary)]/25 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--secondary)] data-[state=checked]:bg-[var(--secondary)]',
        className,
      )}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        maxWidth: dimension,
        maxHeight: dimension,
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex h-full w-full items-center justify-center text-white">
        <Check style={{ width: iconSize, height: iconSize }} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
