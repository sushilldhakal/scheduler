'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Scheduler,
  SchedulerSettings,
  createSchedulerConfig,
  type Block,
  type AuditEntry,
  type SchedulerMarker,
  type ShiftDependency,
  type EmployeeAvailability,
  type HistogramConfig,
} from '@sushill/shadcn-scheduler';
import {
  categories,
  employees,
  testShifts,
  demoMarkers,
  demoDependencies,
  demoAvailability,
} from '@/lib/demo/testData';
import { useWidth } from '@/components/docs/width-context';

const HISTOGRAM_CONFIG: HistogramConfig = {
  capacities: [
    { resourceId: 'c1', hours: 40 },
    { resourceId: 'c2', hours: 35 },
    { resourceId: 'c3', hours: 45 },
    { resourceId: 'c4', hours: 30 },
    { resourceId: 'c5', hours: 40 },
  ],
};

const FEATURE_TOGGLES = [
  { key: 'histogram',    label: '📊 Histogram' },
  { key: 'markers',      label: '📍 Markers' },
  { key: 'availability', label: '🕐 Availability' },
  { key: 'dependencies', label: '🔗 Dependencies' },
  { key: 'audit',        label: '📋 Audit log' },
] as const;

type FeatureKey = typeof FEATURE_TOGGLES[number]['key'];

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Block[]>(testShifts);
  const [markers, setMarkers] = useState<SchedulerMarker[]>(demoMarkers);
  const [dependencies, setDependencies] = useState(demoDependencies);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [active, setActive] = useState<Set<FeatureKey>>(new Set(['histogram', 'markers']));
  const { fullWidth } = useWidth();

  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6';

  useEffect(() => {
    setMounted(true);
    setInitialDate(new Date());
  }, []);

  const toggle = (key: FeatureKey) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleAuditEvent = useCallback((entry: AuditEntry) => {
    setAuditLog((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const schedulerConfig = useMemo(() => createSchedulerConfig({
    initialScrollToNow: true,
    snapMinutes: 30,
    defaultSettings: {
      rowMode: active.has('availability') ? 'individual' : 'category',
    },
  }), [active.has('availability')]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !initialDate) {
    return (
      <div className={containerClass}>
        <div className="scheduler-wrapper w-full h-[700px] rounded-lg border animate-pulse bg-muted not-prose" />
      </div>
    );
  }

  const showAudit = active.has('audit');

  return (
    <div className={containerClass}>
      {/* Feature toggle bar */}
      <div className="flex flex-wrap items-center gap-2 py-2 not-prose">
        <span className="text-xs font-medium text-muted-foreground mr-1">Features:</span>
        {FEATURE_TOGGLES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              active.has(key)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            {label}
          </button>
        ))}
        {auditLog.length > 0 && active.has('audit') && (
          <button
            onClick={() => setAuditLog([])}
            className="ml-auto rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Clear log
          </button>
        )}
      </div>

      {/* Feature descriptions */}
      <div className="flex flex-wrap gap-2 pb-2 not-prose">
        {active.has('markers') && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-400">
            📍 Drag the amber &amp; blue marker lines on the grid
          </span>
        )}
        {active.has('availability') && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            🕐 Switched to individual mode — diagonal stripes show unavailable hours for Carol C. &amp; Eva E. (weekends + outside 9–5)
          </span>
        )}
        {active.has('dependencies') && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 border border-primary/20 px-2 py-0.5 text-[11px] text-primary">
            🔗 Curved arrows show shift handover dependencies
          </span>
        )}
      </div>

      {/* Audit log */}
      {showAudit && auditLog.length > 0 && (
        <div className="mb-2 max-h-32 overflow-y-auto rounded-md border border-border bg-muted/50 p-2 not-prose">
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

      {/* Scheduler */}
      <div className="scheduler-wrapper w-full overflow-hidden not-prose" style={{ height: '72vh', minHeight: 500 }}>
        <Scheduler
          categories={categories}
          employees={employees}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          initialDate={initialDate}
          bufferDays={7}
          config={schedulerConfig}
          /* New features — toggled by the pill buttons */
          markers={active.has('markers') ? markers : []}
          onMarkersChange={active.has('markers') ? setMarkers : undefined}
          dependencies={active.has('dependencies') ? dependencies : []}
          onDependenciesChange={active.has('dependencies') ? setDependencies : undefined}
          availability={active.has('availability') ? demoAvailability : []}
          showHistogram={active.has('histogram')}
          histogramHeight={130}
          histogramConfig={active.has('histogram') ? HISTOGRAM_CONFIG : undefined}
          onAuditEvent={active.has('audit') ? handleAuditEvent : undefined}
          footerSlot={({ onSettingsChange }) => (
            <SchedulerSettings onSettingsChange={onSettingsChange} />
          )}
        />
      </div>

      {/* Feature legend */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 not-prose">
        {[
          { label: 'Recurring shifts', desc: 'Alice A. (Mon–Fri) & Bob B. (every 2 days) repeat automatically', color: 'bg-blue-500' },
          { label: 'Markers', desc: 'Drag the vertical lines to move deadlines', color: 'bg-amber-500' },
          { label: 'Availability', desc: 'Diagonal stripes show when staff are unavailable', color: 'bg-muted-foreground' },
          { label: 'Histogram', desc: 'Bar chart shows hours vs capacity per department', color: 'bg-emerald-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
            <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.color}`} />
            <div>
              <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
