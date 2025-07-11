import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{
  value: string;
  setValue: (value: string) => void;
} | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
}

export function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center justify-start rounded-md bg-muted p-1', className)}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  const selected = context.value === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      aria-controls={`tab-content-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
        selected
          ? 'bg-background text-primary shadow'
          : 'text-muted-foreground hover:bg-muted',
        className
      )}
      onClick={() => context.setValue(value)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  if (context.value !== value) return null;
  return (
    <div
      id={`tab-content-${value}`}
      role="tabpanel"
      className={cn('w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
} 