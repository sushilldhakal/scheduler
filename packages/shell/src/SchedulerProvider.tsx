// Scheduler Provider — React context matching the real shadcn-scheduler context shape.
import React, { createContext, useContext, useMemo } from 'react'
import type { Resource, Settings, SchedulerConfig, CategoryColor, SchedulerSlots } from '@shadcn-scheduler/core'
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORY_COLORS,
  getCategoryColor,
  fmt12,
  nextUid as coreNextUid,
} from '@shadcn-scheduler/core'
import type { SchedulerContextValue, Plugin } from './types'

const DEFAULT_LABELS = {
  category: 'Category',
  employee: 'Employee',
  shift: 'Shift',
  staff: 'Staff',
  roster: 'Roster',
  addShift: 'Add Shift',
  publish: 'Publish',
  draft: 'Draft',
  published: 'Published',
  selectStaff: 'Select staff',
  copyLastWeek: 'Copy Last Week',
  fillFromSchedules: 'Fill from Schedules',
  publishAll: 'Publish All',
  categories: 'Categories',
}

export const SchedulerContext = createContext<SchedulerContextValue | null>(null)

export interface SchedulerProviderProps {
  categories: Resource[]
  employees: Resource[]
  config?: SchedulerConfig
  nextUidFn?: () => string
  slots?: Partial<SchedulerSlots>
  plugins?: Plugin[]
  children: React.ReactNode
}

export function SchedulerProvider({
  categories,
  employees,
  config,
  nextUidFn,
  slots: slotsProp,
  children,
}: SchedulerProviderProps) {
  const slots = useMemo(() => slotsProp ?? {}, [slotsProp])

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...config?.labels }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config?.labels)]
  )

  const settings: Settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...config?.defaultSettings }),
    [config?.defaultSettings]
  )

  const categoryColors = config?.categoryColors ?? DEFAULT_CATEGORY_COLORS

  const getColor = useMemo(
    () => (idx: number): CategoryColor => getCategoryColor(idx, categoryColors),
    [categoryColors]
  )

  const getTimeLabel = useMemo(
    () => (_isoDate: string, hour: number) => fmt12(hour),
    []
  )

  const getDateLabel = useMemo(
    () =>
      (date: Date, options?: Intl.DateTimeFormatOptions) =>
        date.toLocaleDateString(config?.locale ?? 'en-US', options),
    [config?.locale]
  )

  const value: SchedulerContextValue = useMemo(
    () => ({
      categories,
      employees,
      labels,
      getColor,
      settings,
      nextUid: nextUidFn ?? coreNextUid,
      slots,
      snapMinutes: config?.snapMinutes,
      timezone: config?.timezone,
      locale: config?.locale,
      isRTL: config?.isRTL,
      allowOvernight: config?.allowOvernight,
      timelineSidebarFlat: config?.timelineSidebarFlat,
      getTimeLabel,
      getDateLabel,
    }),
    [
      categories,
      employees,
      labels,
      getColor,
      settings,
      nextUidFn,
      slots,
      config?.snapMinutes,
      config?.timezone,
      config?.locale,
      config?.isRTL,
      config?.allowOvernight,
      config?.timelineSidebarFlat,
      getTimeLabel,
      getDateLabel,
    ]
  )

  return (
    <SchedulerContext.Provider value={value}>
      {children}
    </SchedulerContext.Provider>
  )
}

export function useSchedulerContext(): SchedulerContextValue {
  const ctx = useContext(SchedulerContext)
  if (!ctx) {
    throw new Error('useSchedulerContext must be used within a SchedulerProvider')
  }
  return ctx
}
