import { useState, useCallback } from 'react'

export interface AvailabilityWindow {
  dayOfWeek?: number
  date?: string
  startH: number
  endH: number
}

export interface EmployeeAvailability {
  employeeId: string
  windows: AvailabilityWindow[]
}

export interface ConflictResult {
  blockId: string
  employeeId: string
  reason: string
}

export interface UseAvailabilityReturn {
  availability: EmployeeAvailability[]
  setEmployeeAvailability: (employeeId: string, windows: AvailabilityWindow[]) => void
  removeEmployeeAvailability: (employeeId: string) => void
  getAvailability: (employeeId: string) => EmployeeAvailability | undefined
  isAvailable: (employeeId: string, date: string, startH: number, endH: number) => boolean
}

/**
 * Manages a collection of employee availability windows.
 * Pass the resulting `availability` array to the Scheduler `availability` prop.
 */
export function useAvailability(
  initial: EmployeeAvailability[] = []
): UseAvailabilityReturn {
  const [availability, setAvailability] = useState<EmployeeAvailability[]>(initial)

  const setEmployeeAvailability = useCallback(
    (employeeId: string, windows: AvailabilityWindow[]) => {
      setAvailability((prev) => {
        const filtered = prev.filter((a) => a.employeeId !== employeeId)
        return [...filtered, { employeeId, windows }]
      })
    },
    []
  )

  const removeEmployeeAvailability = useCallback((employeeId: string) => {
    setAvailability((prev) => prev.filter((a) => a.employeeId !== employeeId))
  }, [])

  const getAvailability = useCallback(
    (employeeId: string): EmployeeAvailability | undefined =>
      availability.find((a) => a.employeeId === employeeId),
    [availability]
  )

  const isAvailable = useCallback(
    (employeeId: string, date: string, startH: number, endH: number): boolean => {
      const emp = availability.find((a) => a.employeeId === employeeId)
      if (!emp) return true
      const d = new Date(date + 'T12:00:00')
      const dow = d.getDay()
      return emp.windows.some((w) => {
        const dowOk = w.dayOfWeek === undefined || w.dayOfWeek === dow
        const dateOk = w.date === undefined || w.date === date
        const timeOk = startH >= w.startH && endH <= w.endH
        return dowOk && dateOk && timeOk
      })
    },
    [availability]
  )

  return {
    availability,
    setEmployeeAvailability,
    removeEmployeeAvailability,
    getAvailability,
    isAvailable,
  }
}
