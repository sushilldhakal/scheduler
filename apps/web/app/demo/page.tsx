'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Scheduler,
  SchedulerSettings,
  createSchedulerConfig,
  type Block,
  type AuditEntry,
} from '@sushill/shadcn-scheduler';
import { categories, employees, testShifts } from '@/lib/demo/testData';
import { useWidth } from '@/components/docs/width-context';

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Block[]>(testShifts);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const { fullWidth } = useWidth();
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6';

  useEffect(() => {
    setMounted(true);
    setInitialDate(new Date());
  }, []);

  const handleAuditEvent = useCallback((entry: AuditEntry) => {
    setAuditLog((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const handleBlockMove = useCallback((block: Block) => {
  }, []);

  const handleBlockCreate = useCallback((block: Block) => {
  }, []);

  const handleBlockDelete = useCallback((block: Block) => {
  }, []);

  if (!mounted || !initialDate) {
    return (
      <div className={containerClass}>
        <div className="scheduler-wrapper w-full h-[600px] rounded-lg border animate-pulse bg-muted not-prose" />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Audit log toggle */}
      <div className="flex items-center justify-end gap-2 py-2 not-prose">
        <button
          onClick={() => setShowAudit((v) => !v)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {showAudit ? 'Hide' : 'Show'} audit log {auditLog.length > 0 && `(${auditLog.length})`}
        </button>
        {auditLog.length > 0 && (
          <button
            onClick={() => setAuditLog([])}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {showAudit && auditLog.length > 0 && (
        <div className="mb-2 max-h-40 overflow-y-auto rounded-md border border-border bg-muted/50 p-2 not-prose">
          {auditLog.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              <span className="shrink-0 text-foreground font-semibold">{entry.action}</span>
              <span className="shrink-0">{entry.blockId.slice(0, 8)}</span>
              <span className="shrink-0 text-[10px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              {entry.after && (
                <span className="truncate opacity-60">
                  → {(entry.after as Block).employee} {(entry.after as Block).date} {(entry.after as Block).startH}–{(entry.after as Block).endH}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="scheduler-wrapper w-full overflow-hidden not-prose"
        style={{ height: showAudit && auditLog.length > 0 ? 'height-full' : 'height-full' }}
      >
        <Scheduler
          categories={categories}
          employees={employees}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          initialDate={initialDate}
          bufferDays={7}
          config={createSchedulerConfig({
            initialScrollToNow: true,
            snapMinutes: 30,
          })}
          onBlockCreate={handleBlockCreate}
          onBlockMove={handleBlockMove}
          onBlockDelete={handleBlockDelete}
          onAuditEvent={handleAuditEvent}
          footerSlot={({ onSettingsChange }) => (
            <SchedulerSettings onSettingsChange={onSettingsChange} />
          )}
        />
      </div>
    </div>
  );
}
