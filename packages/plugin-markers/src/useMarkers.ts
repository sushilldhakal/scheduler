import { useState, useCallback } from 'react'
import { nextUid } from '@shadcn-scheduler/core'

export interface SchedulerMarker {
  id: string
  /** ISO date string YYYY-MM-DD */
  date: string
  /** Decimal hour (e.g. 9.5 = 09:30). Optional — defaults to day boundary. */
  hour?: number
  label?: string
  /** CSS color. Defaults to var(--destructive). */
  color?: string
  draggable?: boolean
}

export interface UseMarkersReturn {
  markers: SchedulerMarker[]
  addMarker: (marker: Omit<SchedulerMarker, 'id'>) => string
  updateMarker: (id: string, patch: Partial<Omit<SchedulerMarker, 'id'>>) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
}

/**
 * Manages a collection of scheduler marker lines.
 * The resulting `markers` array can be passed directly to the Scheduler `markers` prop.
 */
export function useMarkers(initial: SchedulerMarker[] = []): UseMarkersReturn {
  const [markers, setMarkers] = useState<SchedulerMarker[]>(initial)

  const addMarker = useCallback((marker: Omit<SchedulerMarker, 'id'>): string => {
    const id = nextUid()
    setMarkers((prev) => [...prev, { ...marker, id }])
    return id
  }, [])

  const updateMarker = useCallback((id: string, patch: Partial<Omit<SchedulerMarker, 'id'>>): void => {
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const removeMarker = useCallback((id: string): void => {
    setMarkers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const clearMarkers = useCallback((): void => {
    setMarkers([])
  }, [])

  return { markers, addMarker, updateMarker, removeMarker, clearMarkers }
}
