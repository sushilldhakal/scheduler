'use client';

import { useEffect, useState } from 'react';
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
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6';

  useEffect(() => {
    // Client-only init: capture date after mount to avoid hydration mismatch
    setMounted(true);
    setInitialDate(new Date());
  }, []);

  if (mounted && initialDate) {
    const toLocalYMD = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const day = initialDate.getDay();
    const weekStart = new Date(initialDate);
    weekStart.setDate(initialDate.getDate() + (day === 0 ? -6 : 1 - day));
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
    console.log('[Demo] initialDate:', initialDate);
    console.log('[Demo] week range (Mon–Sun):', toLocalYMD(weekDates[0]), '–', toLocalYMD(weekDates[6]));
    console.log('[Demo] day range:', toLocalYMD(initialDate));
  }

  if (!mounted || !initialDate) {
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
          categories={categories}
          employees={employees}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          initialDate={initialDate}
          bufferDays={7}
          config={createSchedulerConfig({ initialScrollToNow: true })}
          onVisibleRangeChange={(start, end) => {
            const toYMD = (d: Date) =>
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            console.log('[Demo] Scheduler visible range:', toYMD(start), '–', toYMD(end));
          }}
          footerSlot={({ onSettingsChange }) => (
            <SchedulerSettings onSettingsChange={onSettingsChange} />
          )}
        />
      </div>
    </div>
  );
}

