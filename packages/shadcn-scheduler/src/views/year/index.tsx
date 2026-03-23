/**
 * @sushill/shadcn-scheduler/views/year
 *
 * Pre-configured Scheduler locked to the year view.
 * Import this when you only need the year view — unused views are
 * excluded from your bundle by your bundler's tree-shaking.
 *
 * @example
 * import { SchedulerYear } from "@sushill/shadcn-scheduler/views/year"
 * <SchedulerYear shifts={shifts} onShiftsChange={setShifts} categories={categories} employees={employees} />
 */
import React from "react"
import { Scheduler } from "../../core/Scheduler"
import type { SchedulerProps } from "../../core/Scheduler"

/** All SchedulerProps except initialView and showViewTabs (fixed by this wrapper). */
export type SchedulerYearProps = Omit<SchedulerProps, "initialView" | "showViewTabs">

export function SchedulerYear({ config, ...props }: SchedulerYearProps): React.ReactElement {
  return (
    <Scheduler
      {...props}
      initialView="year"
      showViewTabs={false}
      config={config}
    />
  )
}

export type { SchedulerProps }
