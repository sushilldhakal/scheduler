'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useWidth } from '@/components/docs/width-context';

export function FullWidthToggleNav() {
  const { fullWidth, toggleFullWidth } = useWidth();

  return (
    <button
      type="button"
      onClick={toggleFullWidth}
      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      aria-label={fullWidth ? 'Switch to contained width' : 'Switch to full width'}
    >
      {fullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );
}

