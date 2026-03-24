// Scheduler Provider — full production implementation matching packages/shadcn-scheduler/context.tsx
import React, { createContext, useContext, useMemo } from 'react'
import type { Resource, Settings, SchedulerConfig, CategoryColor, SchedulerSlots } from '@shadcn-scheduler/core'
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORY_COLORS,
  getCategoryColor,
  fmt12,
  nextUid as coreNextUid,
  formatInTimezone,
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
  // Stable slots reference — new {} every render would invalidate context memo
  const slots = useMemo(() => slotsProp ?? {}, [slotsProp])

  // Fine-grained label memoization — each label string is a separate dep so the
  // memo only re-runs when a specific label string changes, not on every config
  // object reference change.
  const labelCategory          = config?.labels?.category
  const labelEmployee          = config?.labels?.employee
  const labelShift             = config?.labels?.shift
  const labelStaff             = config?.labels?.staff
  const labelRoster            = config?.labels?.roster
  const labelAddShift          = config?.labels?.addShift
  const labelPublish           = config?.labels?.publish
  const labelDraft             = config?.labels?.draft
  const labelPublished         = config?.labels?.published
  const labelSelectStaff       = config?.labels?.selectStaff
  const labelCopyLastWeek      = config?.labels?.copyLastWeek
  const labelFillFromSchedules = config?.labels?.fillFromSchedules
  const labelPublishAll        = config?.labels?.publishAll
  const labelCategories        = config?.labels?.categories

  const labels = useMemo(
    () => ({
      ...DEFAULT_LABELS,
      ...(labelCategory          !== undefined && { category: labelCategory }),
      ...(labelEmployee          !== undefined && { employee: labelEmployee }),
      ...(labelShift             !== undefined && { shift: labelShift }),
      ...(labelStaff             !== undefined && { staff: labelStaff }),
      ...(labelRoster            !== undefined && { roster: labelRoster }),
      ...(labelAddShift          !== undefined && { addShift: labelAddShift }),
      ...(labelPublish           !== undefined && { publish: labelPublish }),
      ...(labelDraft             !== undefined && { draft: labelDraft }),
      ...(labelPublished         !== undefined && { published: labelPublished }),
      ...(labelSelectStaff       !== undefined && { selectStaff: labelSelectStaff }),
      ...(labelCopyLastWeek      !== undefined && { copyLastWeek: labelCopyLastWeek }),
      ...(labelFillFromSchedules !== undefined && { fillFromSchedules: labelFillFromSchedules }),
      ...(labelPublishAll        !== undefined && { publishAll: labelPublishAll }),
      ...(labelCategories        !== undefined && { categories: labelCategories }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      labelCategory, labelEmployee, labelShift, labelStaff, labelRoster,
      labelAddShift, labelPublish, labelDraft, labelPublished, labelSelectStaff,
      labelCopyLastWeek, labelFillFromSchedules, labelPublishAll, labelCategories,
    ]
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

  // Timezone-aware time label — uses Intl when timezone is set, falls back to fmt12
  const getTimeLabel = useMemo(
    () =>
      config?.timezone
        ? (isoDate: string, hour: number) =>
            formatInTimezone(isoDate, hour, config.timezone!, config?.locale)
        : (_isoDate: string, hour: number) => fmt12(hour),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config?.timezone, config?.locale]
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
      categories, employees, labels, getColor, settings, nextUidFn, slots,
      config?.snapMinutes, config?.timezone, config?.locale, config?.isRTL,
      config?.allowOvernight, config?.timelineSidebarFlat, getTimeLabel, getDateLabel,
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
  if (!ctx) throw new Error('useSchedulerContext must be used within a SchedulerProvider')
  return ctx
}
