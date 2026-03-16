'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Scheduler,
  SchedulerSettings,
  createSchedulerConfig,
  type Block,
} from '@sushill/shadcn-scheduler';
import { categories, employees, testShifts } from '@/lib/demo/testData';
import { useWidth } from '@/components/docs/width-context';

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Block[]>(testShifts);
  const { fullWidth } = useWidth();

  // Always anchor demo to the current week (Monday–Sunday) and trigger "Go to today" once on mount
  const { initialDate, schedulerKey } = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sun, 1 = Mon, ...
    // Monday as first day of week
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    return {
      initialDate: weekStart,
      schedulerKey: weekStart.toISOString().slice(0, 10),
    };
  }, []);

  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={containerClass}>
        <div className="scheduler-wrapper w-full h-[600px] rounded-lg border animate-pulse bg-muted not-prose" />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div
        className="scheduler-wrapper w-full overflow-hidden"
        style={{ height: 'calc(100vh - 56px)' }}
      >
        <Scheduler
          key={schedulerKey}
          categories={categories}
          employees={employees}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          initialDate={initialDate}
          bufferDays={7}
          config={createSchedulerConfig({ initialScrollToNow: true })}
          footerSlot={({ onSettingsChange }) => (
            <SchedulerSettings onSettingsChange={onSettingsChange} />
          )}
        />
      </div>
    </div>
  );
}

