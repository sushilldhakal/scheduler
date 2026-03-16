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

const config = createSchedulerConfig({
  initialScrollToNow: true,
});

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Block[]>(testShifts);
  const { fullWidth } = useWidth();

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
          categories={categories}
          employees={employees}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          bufferDays={7}
          config={config}
          footerSlot={({ onSettingsChange }) => (
            <SchedulerSettings onSettingsChange={onSettingsChange} />
          )}
        />
      </div>
    </div>
  );
}

