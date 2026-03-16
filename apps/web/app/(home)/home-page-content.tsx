'use client';

import { useWidth } from '@/components/docs/width-context';
import { cn } from '@/lib/cn';

export function HomePageContent({ children }: { children: React.ReactNode }) {
  const { fullWidth } = useWidth();
  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl w-full px-4 sm:px-6';

  return (
    <div className={cn('layout-container min-h-screen bg-background text-foreground', containerClass)}>
      {children}
    </div>
  );
}
