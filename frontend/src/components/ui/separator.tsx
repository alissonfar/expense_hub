import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'separator' : undefined}
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal'
          ? 'h-px w-full bg-border my-4'
          : 'w-px h-full bg-border mx-4',
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = 'Separator'; 