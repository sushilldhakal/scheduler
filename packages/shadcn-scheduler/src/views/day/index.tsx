/**
 * @sushill/shadcn-scheduler/views/day
 *
 * Pre-configured Scheduler locked to the day view.
 * Import this when you only need the day view — unused views are
 * excluded from your bundle by your bundler's tree-shaking.
 *
 * @example
 * import { SchedulerDay } from "@sushill/shadcn-scheduler/views/day"
 * <SchedulerDay shifts={shifts} onShiftsChange={setShifts} categories={categories} employees={employees} />
 */
import React from "react"
import { Scheduler } from "../../core/Scheduler"
import type { SchedulerProps } from "../../core/Scheduler"

/** All SchedulerProps except initialView and showViewTabs (fixed by this wrapper). */
export type SchedulerDayProps = Omit<SchedulerProps, "initialView" | "showViewTabs">

export function SchedulerDay({ config, ...props }: SchedulerDayProps): React.ReactElement {
  return (
    <Scheduler
      {...props}
      initialView="day"
      showViewTabs={false}
      config={config}
    />
  )
}

export type { SchedulerProps }
