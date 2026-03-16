import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerConferenceProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Conference-domain scheduler: Track/Session vocabulary.
 * Applies preset "conference"; pass config to override.
 */
export function SchedulerConference({
  config: configOverrides,
  ...props
}: SchedulerConferenceProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "conference", ...configOverrides })
  return <Scheduler {...props} config={config} />
}

export type { Block, Resource }
