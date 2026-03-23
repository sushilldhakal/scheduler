/**
 * @sushill/shadcn-scheduler/views/timeline
 *
 * Pre-configured Scheduler locked to the timeline view.
 * Import this when you only need the timeline view — unused views are
 * excluded from your bundle by your bundler's tree-shaking.
 *
 * @example
 * import { SchedulerTimeline } from "@sushill/shadcn-scheduler/views/timeline"
 * <SchedulerTimeline shifts={shifts} onShiftsChange={setShifts} categories={categories} employees={employees} />
 */
import React from "react"
import { Scheduler } from "../../core/Scheduler"
import type { SchedulerProps } from "../../core/Scheduler"

/** All SchedulerProps except initialView and showViewTabs (fixed by this wrapper). */
export type SchedulerTimelineProps = Omit<SchedulerProps, "initialView" | "showViewTabs">

export function SchedulerTimeline({ config, ...props }: SchedulerTimelineProps): React.ReactElement {
  return (
    <Scheduler
      {...props}
      initialView="timeline"
      showViewTabs={false}
      config={config}
    />
  )
}

export type { SchedulerProps }
