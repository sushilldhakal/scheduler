import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerFestivalProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Festival-domain scheduler: Stage/Set vocabulary.
 * Applies preset "festival"; pass config to override.
 */
export function SchedulerFestival({
  config: configOverrides,
  ...props
}: SchedulerFestivalProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "festival", ...configOverrides })
  return <Scheduler {...props} config={config} />
}

export type { Block, Resource }
