import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerGanttProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Project Gantt — timeline + week views only, no list/month/year.
 */
export function SchedulerGantt({
  config: configOverrides,
  ...props
}: SchedulerGanttProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "gantt", ...configOverrides })
  return (
    <Scheduler
      {...props}
      config={{ ...config, views: { timeline: true, week: true } }}
      initialView="timeline"
      showViewTabs={true}
      showAddShiftButton={true}
      addShiftLabel="Add Task"
    />
  )
}

export type { Block, Resource }
