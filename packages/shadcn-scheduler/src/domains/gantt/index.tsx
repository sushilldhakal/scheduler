import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerGanttProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Gantt-domain scheduler: Project/Task vocabulary.
 * Applies preset "gantt"; pass config to override.
 */
export function SchedulerGantt({
  config: configOverrides,
  ...props
}: SchedulerGanttProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "gantt", ...configOverrides })
  return <Scheduler {...props} config={config} />
}

export type { Block, Resource }
