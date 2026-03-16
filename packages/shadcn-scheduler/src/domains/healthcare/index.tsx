import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerHealthcareProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Healthcare-domain scheduler: Ward/Rota vocabulary.
 * Applies preset "healthcare"; pass config to override.
 */
export function SchedulerHealthcare({
  config: configOverrides,
  ...props
}: SchedulerHealthcareProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "healthcare", ...configOverrides })
  return <Scheduler {...props} config={config} />
}

export type { Block, Resource }
