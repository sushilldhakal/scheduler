"use client"

import React, { useState, useCallback, useContext } from "react"
import type { Shift, Category, Settings } from "./types"
import { Button } from "./components/ui/button"
import { Plus } from "lucide-react"
import { SchedulerProvider, nextUid, SchedulerContext } from "./context"
import { getWeekDates, sameDay } from "./constants"
import { TodayButton, DateNavigator } from "./components/DateNavigator"
import { ViewTabs } from "./components/ViewTabs"
import { UserSelect } from "./components/UserSelect"
import { AddShiftModal } from "./components/modals/AddShiftModal"
import { ShiftModal } from "./components/modals/ShiftModal"
import { DayView, WeekView } from "./components/views/DayWeekViews"
import { MonthView } from "./components/views/MonthView"
import { YearView } from "./components/views/YearView"
import { ListView } from "./components/views/ListView"
import type { Employee } from "./types"
import type { SchedulerConfig, SchedulerSettingsContext } from "./types"

interface AddContext {
  date: Date
  categoryId?: string | null
  empId?: string | null
}

export interface SchedulerProps {
  categories?: Category[]
  employees?: Employee[]
  shifts: Shift[]
  onShiftsChange: (shifts: Shift[]) => void
  config?: SchedulerConfig
  settings?: Partial<Settings>
  initialView?: string
  initialDate?: Date
  /**
   * Custom action buttons to render before the Add Shift button.
   * Pass a ReactNode or a function that receives actions (copyLastWeek, publishAllDrafts, draftCount) to build custom UI.
   */
  headerActions?: React.ReactNode | ((actions: SchedulerHeaderActions) => React.ReactNode)
  /**
   * Renders in the header next to actions (e.g. Settings gear icon).
   * Receives { onSettingsChange } to control visible hours, working hours, badge variant.
   */
  footerSlot?: (ctx: SchedulerSettingsContext) => React.ReactNode
}

export interface SchedulerHeaderActions {
  copyLastWeek: () => void
  publishAllDrafts: () => void
  draftCount: number
}

export function Scheduler({
  categories: categoriesProp,
  employees: employeesProp,
  shifts,
  onShiftsChange,
  config,
  settings: settingsProp,
  initialView = "week",
  initialDate,
  headerActions,
  footerSlot,
}: SchedulerProps): JSX.Element {
  const parentCtx = useContext(SchedulerContext)
  const categories = categoriesProp ?? parentCtx?.categories ?? []
  const employees = employeesProp ?? parentCtx?.employees ?? []
  if (categories.length === 0 || employees.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Provide categories and employees to the Scheduler or SchedulerProvider.
      </div>
    )
  }
  const setShifts = useCallback(
    (updater: React.SetStateAction<Shift[]>) => {
      const next = typeof updater === "function" ? updater(shifts) : updater
      onShiftsChange(next)
    },
    [shifts, onShiftsChange]
  )

  const [view, setView] = useState<string>(initialView)
  const [currentDate, setCurrentDate] = useState<Date>(initialDate ?? new Date())
  const [selShift, setSelShift] = useState<Shift | null>(null)
  const [selCategory, setSelCategory] = useState<Category | null>(null)
  const [addCtx, setAddCtx] = useState<AddContext | null>(null)
  const [settingsOverride, setSettingsOverride] = useState<Partial<import("./types").Settings>>({})
  const [selEmps, setSelEmps] = useState<Set<string>>(
    () => new Set(employees.map((e) => e.id))
  )

  const onShiftClick = (s: Shift, c: Category): void => {
    setSelShift(s)
    setSelCategory(c)
  }
  const onAddShift = (
    date: Date,
    categoryId?: string | null,
    empId?: string | null
  ): void => setAddCtx({ date, categoryId, empId })
  const handleAdd = (shift: Shift): void =>
    setShifts((prev) => [...prev, shift])

  const publishShifts = useCallback(
    (...ids: string[]): void =>
      setShifts((prev) =>
        prev.map((s) => (ids.includes(s.id) ? { ...s, status: "published" } : s))
      ),
    [setShifts]
  )

  const unpublishShift = useCallback(
    (id: string): void =>
      setShifts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "draft" } : s))
      ),
    [setShifts]
  )

  const toggleEmp = (id: string): void =>
    setSelEmps((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const navigate = (dir: number): void => {
    const d = new Date(currentDate)
    const b = view.replace("list", "") || "day"
    if (b === "day") d.setDate(d.getDate() + dir)
    if (b === "week") d.setDate(d.getDate() + dir * 7)
    if (b === "month") d.setMonth(d.getMonth() + dir)
    if (b === "year") d.setFullYear(d.getFullYear() + dir)
    setCurrentDate(d)
  }

  const copyLastWeek = (): void => {
    const wd = getWeekDates(currentDate)
    const lw = wd.map((d) => {
      const nd = new Date(d)
      nd.setDate(nd.getDate() - 7)
      return nd
    })
    const lws = shifts.filter((s) => lw.some((d) => sameDay(d, s.date)))
    setShifts((prev) => [
      ...prev,
      ...lws.map((s) => {
        const di = lw.findIndex((d) => sameDay(d, s.date))
        return {
          ...s,
          id: nextUid(),
          date: new Date(wd[di]),
          status: "draft" as const,
        }
      }),
    ])
  }

  const isListView = view.startsWith("list")
  const baseView = view.replace("list", "") || "day"
  const draftCount = shifts.filter((s) => s.status === "draft").length

  const sharedGridProps = {
    shifts,
    setShifts,
    selEmps,
    onShiftClick,
    onAddShift,
  }

  const handleTodayClick = (): void => setCurrentDate(new Date())
  const handleAllEmployees = (): void =>
    setSelEmps(new Set(employees.map((e) => e.id)))
  const handleNoEmployees = (): void => setSelEmps(new Set())
  const handlePublishAllDrafts = (): void =>
    publishShifts(
      ...shifts.filter((s) => s.status === "draft").map((s) => s.id)
    )
  const handlePublishAllFromBanner = (): void =>
    setShifts((prev) => prev.map((s) => ({ ...s, status: "published" })))
  const handleAddShiftButton = (): void => onAddShift(new Date(), null, null)
  const handleMonthClick = (y: number, m: number): void => {
    setCurrentDate(new Date(y, m, 1))
    setView("month")
  }
  const handleShiftModalPublish = (id: string): void => {
    publishShifts(id)
    setSelShift((s) => (s ? { ...s, status: "published" } : null))
  }
  const handleShiftModalUnpublish = (id: string): void => {
    unpublishShift(id)
    setSelShift((s) => (s ? { ...s, status: "draft" } : null))
  }
  const handleCloseShiftModal = (): void => {
    setSelShift(null)
    setSelCategory(null)
  }
  const handleCloseAddModal = (): void => setAddCtx(null)

  const mergedConfig: SchedulerConfig = {
    ...config,
    defaultSettings: {
      ...config?.defaultSettings,
      ...settingsProp,
      ...settingsOverride,
    },
  }

  const handleSettingsChange = useCallback(
    (partial: Partial<import("./types").Settings>) => {
      setSettingsOverride((prev) => ({ ...prev, ...partial }))
    },
    []
  )

  const content = (
      <div
        className="flex h-screen flex-col overflow-hidden bg-slate-50"
        style={{
          fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
        }}
      >
        {draftCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 20px",
              background: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>
              ✎ {draftCount} shift{draftCount !== 1 ? "s" : ""} in draft — not
              visible to staff
            </span>
            <button
              onClick={handlePublishAllFromBanner}
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "#f59e0b",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              Publish all
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <DateNavigator
              view={view}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onNavigate={navigate}
              shifts={shifts}
              slotAbove={<TodayButton onToday={handleTodayClick} />}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
            <div className="flex w-full items-center gap-2">
              <ViewTabs view={view} setView={setView} />
              <UserSelect
                selEmps={selEmps}
                onToggle={toggleEmp}
                onAll={handleAllEmployees}
                onNone={handleNoEmployees}
              />
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              {footerSlot && footerSlot({ onSettingsChange: handleSettingsChange })}
              {typeof headerActions === "function"
                ? headerActions({
                    copyLastWeek,
                    publishAllDrafts: handlePublishAllDrafts,
                    draftCount,
                  })
                : headerActions}
              <Button onClick={handleAddShiftButton} className="w-full sm:w-auto">
                <Plus size={16} />
                Add Shift
              </Button>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!isListView && baseView === "day" && (
            <DayView
              date={currentDate}
              setDate={setCurrentDate}
              {...sharedGridProps}
            />
          )}
          {!isListView && baseView === "week" && (
            <WeekView
              date={currentDate}
              setDate={setCurrentDate}
              {...sharedGridProps}
            />
          )}
          {!isListView && baseView === "month" && (
            <MonthView
              date={currentDate}
              shifts={shifts}
              setShifts={setShifts}
              onShiftClick={onShiftClick}
              onAddShift={onAddShift}
            />
          )}
          {!isListView && baseView === "year" && (
            <YearView
              date={currentDate}
              shifts={shifts}
              onMonthClick={handleMonthClick}
            />
          )}
          {isListView && (
            <ListView
              shifts={shifts}
              setShifts={setShifts}
              onShiftClick={onShiftClick}
              onPublish={publishShifts}
              onUnpublish={unpublishShift}
              currentDate={currentDate}
              view={view}
            />
          )}
        </div>

        {addCtx && (
          <AddShiftModal
            date={addCtx.date}
            categoryId={addCtx.categoryId ?? undefined}
            employeeId={addCtx.empId ?? undefined}
            onAdd={handleAdd}
            onClose={handleCloseAddModal}
          />
        )}

        <ShiftModal
          shift={selShift}
          category={selCategory}
          onClose={handleCloseShiftModal}
          onPublish={handleShiftModalPublish}
          onUnpublish={handleShiftModalUnpublish}
        />
      </div>
  )

  if (parentCtx) {
    return content
  }
  return (
    <SchedulerProvider
      categories={categories}
      employees={employees}
      config={mergedConfig}
    >
      {content}
    </SchedulerProvider>
  )
}
