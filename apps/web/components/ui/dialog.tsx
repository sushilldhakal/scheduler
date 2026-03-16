'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

type DialogContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextType | null>(null);

export function Dialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open, setOpen }), [open]);
  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('DialogTrigger must be used within Dialog');

  const handleClick: React.MouseEventHandler = (event) => {
    children.props.onClick?.(event);
    if (!event.defaultPrevented) {
      ctx.setOpen(true);
    }
  };

  if (asChild) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return React.createElement('button', { onClick: handleClick }, children);
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('DialogContent must be used within Dialog');
  if (!ctx.open) return null;

  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (event.target === event.currentTarget) {
      ctx.setOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-xl border bg-card p-4 shadow-lg',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold leading-none tracking-tight">
      {children}
    </h2>
  );
}

