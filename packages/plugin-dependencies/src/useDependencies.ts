import { useState, useCallback } from 'react'
import { nextUid } from '@shadcn-scheduler/core'

export type DependencyType =
  | 'finish-to-start'
  | 'start-to-start'
  | 'finish-to-finish'
  | 'start-to-finish'

export interface ShiftDependency {
  id: string
  fromId: string
  toId: string
  type?: DependencyType
  color?: string
  label?: string
}

export interface UseDependenciesReturn {
  dependencies: ShiftDependency[]
  addDependency: (dep: Omit<ShiftDependency, 'id'>) => string
  updateDependency: (id: string, patch: Partial<Omit<ShiftDependency, 'id'>>) => void
  removeDependency: (id: string) => void
  clearDependencies: () => void
  /** Returns all dependencies connected to the given block id */
  getConnected: (blockId: string) => ShiftDependency[]
}

/**
 * Manages shift dependencies (arrows from one block to another).
 * Pass the resulting `dependencies` array to the Scheduler `dependencies` prop.
 */
export function useDependencies(
  initial: ShiftDependency[] = []
): UseDependenciesReturn {
  const [dependencies, setDependencies] = useState<ShiftDependency[]>(initial)

  const addDependency = useCallback(
    (dep: Omit<ShiftDependency, 'id'>): string => {
      const id = nextUid()
      setDependencies((prev) => [...prev, { ...dep, id }])
      return id
    },
    []
  )

  const updateDependency = useCallback(
    (id: string, patch: Partial<Omit<ShiftDependency, 'id'>>): void => {
      setDependencies((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      )
    },
    []
  )

  const removeDependency = useCallback((id: string): void => {
    setDependencies((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clearDependencies = useCallback((): void => {
    setDependencies([])
  }, [])

  const getConnected = useCallback(
    (blockId: string): ShiftDependency[] =>
      dependencies.filter((d) => d.fromId === blockId || d.toId === blockId),
    [dependencies]
  )

  return {
    dependencies,
    addDependency,
    updateDependency,
    removeDependency,
    clearDependencies,
    getConnected,
  }
}
