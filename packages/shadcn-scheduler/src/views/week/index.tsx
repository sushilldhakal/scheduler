/**
 * @sushill/shadcn-scheduler/views/week
 *
 * Pre-configured Scheduler locked to the week view.
 * Import this when you only need the week view — unused views are
 * excluded from your bundle by your bundler's tree-shaking.
 *
 * @example
 * import { SchedulerWeek } from "@sushill/shadcn-scheduler/views/week"
 * <SchedulerWeek shifts={shifts} onShiftsChange={setShifts} categories={categories} employees={employees} />
 */
import React from "react"
import { Scheduler } from "../../core/Scheduler"
import type { SchedulerProps } from "../../core/Scheduler"

/** All SchedulerProps except initialView and showViewTabs (fixed by this wrapper). */
export type SchedulerWeekProps = Omit<SchedulerProps, "initialView" | "showViewTabs">

export function SchedulerWeek({ config, ...props }: SchedulerWeekProps): React.ReactElement {
  return (
    <Scheduler
      {...props}
      initialView="week"
      showViewTabs={false}
      config={config}
    />
  )
}

export type { SchedulerProps }
