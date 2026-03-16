import React, { createContext, useContext, useMemo } from "react"
import type { Resource, SchedulerConfig, CategoryColor, Settings, SchedulerSlots } from "./types"
import { DEFAULT_SETTINGS, DEFAULT_CATEGORY_COLORS, getCategoryColor, fmt12 } from "./constants"
import { formatInTimezone } from "./utils/timezone"

const DEFAULT_LABELS = {
  category: "Category",
  employee: "Employee",
  shift: "Shift",
  staff: "Staff",
  roster: "Roster",
  addShift: "Add Shift",
  publish: "Publish",
  draft: "Draft",
  published: "Published",
  selectStaff: "Select staff",
  copyLastWeek: "Copy Last Week",
  fillFromSchedules: "Fill from Schedules",
  publishAll: "Publish All",
  categories: "Categories",
}

export interface SchedulerContextValue {
  categories: Resource[]
  employees: Resource[]
  labels: typeof DEFAULT_LABELS
  getColor: (idx: number) => CategoryColor
  settings: Settings
  nextUid: () => string
  /** Optional render slots (block, resourceHeader, etc.). Used by engine when provided. */
  slots: Partial<SchedulerSlots>
  /** Snap grid in fractional hours (e.g. 0.25 = 15 min). From config; undefined = use SNAP constant. */
  snapMinutes?: number
  /** IANA timezone (e.g. America/New_York). When set, time display uses Intl with this timezone. */
  timezone?: string
  /** Locale for date/time formatting (e.g. en-US). */
  locale?: string
  /** When true, root gets dir="rtl" and layout mirrors. */
  isRTL?: boolean
  /** Format time for display. When timezone is set uses Intl in that zone; else fmt12(h). */
  getTimeLabel: (isoDate: string, hour: number) => string
  /** Format date for display. Uses locale when set. */
  getDateLabel: (date: Date, options?: Intl.DateTimeFormatOptions) => string
}

export const SchedulerContext = createContext<SchedulerContextValue | null>(null)

let uidCounter = 100
export function nextUid(): string {
  return `s${uidCounter++}`
}

export interface SchedulerProviderProps {
  categories: Resource[]
  employees: Resource[]
  config?: SchedulerConfig
  nextUidFn?: () => string
  /** Optional render slots to override built-in UI. */
  slots?: Partial<SchedulerSlots>
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
  const slots = slotsProp ?? {}
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...config?.labels }),
    [config?.labels]
  )

  const settings: Settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...config?.defaultSettings }),
    [config?.defaultSettings]
  )

  const categoryColors = config?.categoryColors ?? DEFAULT_CATEGORY_COLORS

  const getColor = useMemo(
    () => (idx: number) => getCategoryColor(idx, categoryColors),
    [categoryColors]
  )

  const getTimeLabel = useMemo(
    () =>
      config?.timezone
        ? (isoDate: string, hour: number) =>
            formatInTimezone(isoDate, hour, config.timezone!, config?.locale)
        : (isoDate: string, hour: number) => fmt12(hour),
    [config?.timezone, config?.locale]
  )

  const getDateLabel = useMemo(
    () => (date: Date, options?: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString(config?.locale ?? "en-US", options),
    [config?.locale]
  )

  const value: SchedulerContextValue = useMemo(
    () => ({
      categories,
      employees,
      labels,
      getColor,
      settings,
      nextUid: nextUidFn ?? nextUid,
      slots,
      snapMinutes: config?.snapMinutes,
      timezone: config?.timezone,
      locale: config?.locale,
      isRTL: config?.isRTL,
      getTimeLabel,
      getDateLabel,
    }),
    [categories, employees, labels, getColor, settings, nextUidFn, slots, config?.snapMinutes, config?.timezone, config?.locale, config?.isRTL, getTimeLabel, getDateLabel]
  )

  return (
    <SchedulerContext.Provider value={value}>{children}</SchedulerContext.Provider>
  )
}

export function useSchedulerContext(): SchedulerContextValue {
  const ctx = useContext(SchedulerContext)
  if (!ctx) {
    throw new Error("useSchedulerContext must be used within SchedulerProvider")
  }
  return ctx
}
