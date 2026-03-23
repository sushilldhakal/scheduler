/**
 * @sushill/shadcn-scheduler/views/list
 *
 * Pre-configured Scheduler locked to the list view.
 * Import this when you only need the list view — unused views are
 * excluded from your bundle by your bundler's tree-shaking.
 *
 * @example
 * import { SchedulerList } from "@sushill/shadcn-scheduler/views/list"
 * <SchedulerList shifts={shifts} onShiftsChange={setShifts} categories={categories} employees={employees} />
 */
import React from "react"
import { Scheduler } from "../../core/Scheduler"
import type { SchedulerProps } from "../../core/Scheduler"

/** All SchedulerProps except initialView and showViewTabs (fixed by this wrapper). */
export type SchedulerListProps = Omit<SchedulerProps, "initialView" | "showViewTabs">

export function SchedulerList({ config, ...props }: SchedulerListProps): React.ReactElement {
  return (
    <Scheduler
      {...props}
      initialView="list"
      showViewTabs={false}
      config={config}
    />
  )
}

export type { SchedulerProps }
