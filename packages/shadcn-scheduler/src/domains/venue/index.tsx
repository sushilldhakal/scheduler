import React from "react"
import { Scheduler } from "../../core/Scheduler"
import { createSchedulerConfig } from "../../core/config"
import type { Block, Resource } from "../../core/types"
import type { SchedulerConfig } from "../../core/types"

export interface SchedulerVenueProps extends Omit<React.ComponentProps<typeof Scheduler>, "config"> {
  config?: Partial<SchedulerConfig>
}

/**
 * Venue-domain scheduler: Space/Booking vocabulary.
 * Applies preset "venue"; pass config to override.
 */
export function SchedulerVenue({
  config: configOverrides,
  ...props
}: SchedulerVenueProps): React.ReactElement {
  const config = createSchedulerConfig({ preset: "venue", ...configOverrides })
  return <Scheduler {...props} config={config} />
}

export type { Block, Resource }
