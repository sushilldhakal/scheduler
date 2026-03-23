/**
 * @sushill/shadcn-scheduler/views/month
 *
 * Pre-configured Scheduler locked to the month view.
 * Import this when you only need the month view — unused views are
 * excluded from your bundle by your bundler's tree-shaking.
 *
 * @example
 * import { SchedulerMonth } from "@sushill/shadcn-scheduler/views/month"
 * <SchedulerMonth shifts={shifts} onShiftsChange={setShifts} categories={categories} employees={employees} />
 */
import React from "react"
import { Scheduler } from "../../core/Scheduler"
import type { SchedulerProps } from "../../core/Scheduler"

/** All SchedulerProps except initialView and showViewTabs (fixed by this wrapper). */
export type SchedulerMonthProps = Omit<SchedulerProps, "initialView" | "showViewTabs">

export function SchedulerMonth({ config, ...props }: SchedulerMonthProps): React.ReactElement {
  return (
    <Scheduler
      {...props}
      initialView="month"
      showViewTabs={false}
      config={config}
    />
  )
}

export type { SchedulerProps }
