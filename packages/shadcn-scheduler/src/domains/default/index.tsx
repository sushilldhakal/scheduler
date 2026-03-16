import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerDefaultProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Default roster scheduler: categories, employees, shifts.
 * Applies default preset; pass config to override.
 */
export function SchedulerDefault({
  config: configOverrides,
  ...props
}: SchedulerDefaultProps): React.ReactElement {
  const config = createSchedulerConfig(configOverrides)
  return <Scheduler {...props} config={config} />
}

export type { Block, Resource }
