import React, { createContext, useContext, useMemo } from "react"
import type { Category, Employee, SchedulerConfig, CategoryColor, Settings } from "./types"
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
  roles: "Roles",
}

export interface SchedulerContextValue {
  categories: Category[]
  employees: Employee[]
  labels: typeof DEFAULT_LABELS
  getColor: (idx: number) => CategoryColor
  settings: Settings
  nextUid: () => string
}

export const SchedulerContext = createContext<SchedulerContextValue | null>(null)

let uidCounter = 100
export function nextUid(): string {
  return `s${uidCounter++}`
}

export interface SchedulerProviderProps {
  categories: Category[]
  employees: Employee[]
  config?: SchedulerConfig
  nextUidFn?: () => string
  children: React.ReactNode
}

export function SchedulerProvider({
  categories,
  employees,
  config,
  nextUidFn,
  children,
}: SchedulerProviderProps) {
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
    }),
    [categories, employees, labels, getColor, settings, nextUidFn]
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
