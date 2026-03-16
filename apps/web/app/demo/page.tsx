'use client';

import { useEffect, useState } from 'react';
import {
  Scheduler,
  createSchedulerConfig,
  type Block,
} from '@sushill/shadcn-scheduler';
import { categories, employees, testShifts } from '@/lib/demo/testData';

const config = createSchedulerConfig({
  initialScrollToNow: true,
});

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Block[]>(testShifts);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="scheduler-wrapper w-full h-[600px] rounded-lg border animate-pulse bg-muted not-prose" />
    );
  }

  return (
    <div className="scheduler-wrapper w-full h-[600px] overflow-hidden rounded-lg border not-prose">
      <Scheduler
        categories={categories}
        employees={employees}
        shifts={shifts}
        onShiftsChange={setShifts}
        initialView="week"
        bufferDays={7}
        config={config}
      />
    </div>
  );
}

