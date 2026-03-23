import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerConferenceProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Conference schedule — single-day timeline, no view tabs.
 */
export function SchedulerConference({
  config: configOverrides,
  ...props
}: SchedulerConferenceProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "conference", ...configOverrides })
  return (
    <Scheduler
      {...props}
      config={{ ...config, views: { timeline: true } }}
      initialView="timeline"
      showViewTabs={false}
      showAddShiftButton={false}
      
    />
  )
}

export type { Block, Resource }
