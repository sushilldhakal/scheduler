import { useMemo } from 'react'
import type { Block, Resource } from '@shadcn-scheduler/core'

export interface HistogramCapacity {
  resourceId: string
  hours: number
}

export interface HistogramConfig {
  capacities?: HistogramCapacity[]
}

export interface HistogramBar {
  resource: Resource
  scheduledHours: number
  capacityHours: number
  utilizationPct: number
  /** 'ok' < 80%, 'warning' 80-100%, 'over' > 100% */
  status: 'ok' | 'warning' | 'over'
}

export interface UseHistogramReturn {
  bars: HistogramBar[]
}

/**
 * Computes per-resource utilisation bars from a shifts array and optional capacity config.
 * Does not include a date-range filter — pass only the shifts you want to measure.
 */
export function useHistogram(
  resources: Resource[],
  shifts: Block[],
  config: HistogramConfig = {}
): UseHistogramReturn {
  const bars = useMemo((): HistogramBar[] => {
    const capacityMap = new Map<string, number>(
      (config.capacities ?? []).map((c) => [c.resourceId, c.hours])
    )
    const hoursMap = new Map<string, number>()
    for (const s of shifts) {
      const h = s.endH - s.startH
      hoursMap.set(s.categoryId, (hoursMap.get(s.categoryId) ?? 0) + h)
      if (s.employeeId) {
        hoursMap.set(s.employeeId, (hoursMap.get(s.employeeId) ?? 0) + h)
      }
    }
    return resources.map((r) => {
      const scheduled = hoursMap.get(r.id) ?? 0
      const capacity = capacityMap.get(r.id) ?? 40
      const pct = capacity > 0 ? (scheduled / capacity) * 100 : 0
      return {
        resource: r,
        scheduledHours: scheduled,
        capacityHours: capacity,
        utilizationPct: pct,
        status: pct > 100 ? 'over' : pct >= 80 ? 'warning' : 'ok',
      }
    })
  }, [resources, shifts, config])

  return { bars }
}
