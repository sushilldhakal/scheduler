import React, { createContext, useContext, useMemo } from "react"
import type { Resource, SchedulerConfig, CategoryColor, Settings, SchedulerSlots } from "./types"
import { DEFAULT_SETTINGS, DEFAULT_CATEGORY_COLORS, getCategoryColor } from "./constants"

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

  const value: SchedulerContextValue = useMemo(
    () => ({
      categories,
      employees,
      labels,
      getColor,
      settings,
      nextUid: nextUidFn ?? nextUid,
      slots,
    }),
    [categories, employees, labels, getColor, settings, nextUidFn, slots]
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
