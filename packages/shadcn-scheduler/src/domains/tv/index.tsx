import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerTVProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * TV-domain scheduler: Channel/Program vocabulary, 24h range, timeline view, live indicator.
 * Applies preset "tv"; pass config to override any value.
 * Locked to timeline view — import @sushill/shadcn-scheduler/views/timeline for a lighter bundle.
 */
export function SchedulerTV({
  config: configOverrides,
  ...props
}: SchedulerTVProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "tv", ...configOverrides })
  return (
    <Scheduler
      {...props}
      config={config}
      initialView="timeline"
      showViewTabs={false}
      addShiftLabel={config.labels?.addShift ?? "Add Slot"}
    />
  )
}

export type { Block, Resource }
