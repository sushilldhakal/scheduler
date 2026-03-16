"use client"

import React, { useState, useCallback, useContext, useRef } from "react"
import type { Block, Resource, Settings, SchedulerSlots } from "./types"
import { Button } from "./components/ui/button"
import { Plus, ZoomIn, ZoomOut } from "lucide-react"
import { SchedulerProvider, nextUid, SchedulerContext } from "./context"
import { getWeekDates, sameDay, toDateISO } from "./constants"
import { TodayButton, DateNavigator } from "./components/DateNavigator"
import { ViewTabs } from "./components/ViewTabs"
import { UserSelect } from "./components/UserSelect"
import { AddShiftModal } from "./components/modals/AddShiftModal"
import { ShiftModal } from "./components/modals/ShiftModal"
import { DayView, WeekView } from "./components/views/DayWeekViews"
import { MonthView } from "./components/views/MonthView"
import { YearView } from "./components/views/YearView"
import { ListView } from "./components/views/ListView"
import { TimelineView } from "./components/views/TimelineView"
import type { SchedulerConfig, SchedulerSettingsContext } from "./types"

interface AddContext {
  date: Date
  categoryId?: string | null
  empId?: string | null
}

export interface SchedulerProps {
  categories?: Resource[]
  employees?: Resource[]
  shifts: Block[]
  onShiftsChange: (blocks: Block[]) => void
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
  /**
   * Controls how many days to render before and after the visible range in day/week view.
   * E.g. bufferDays={2} renders 2 days before and 2 days after (5 days total).
   * Larger values enable smooth scrolling but use more memory. Default: 15 (31 days total, same as before).
   */
  bufferDays?: number
  /**
   * Callback fired when the user scrolls near the edge of the visible range.
   * Use this to prefetch data from your API and optionally trim old shifts for garbage collection.
   */
  onVisibleRangeChange?: (visibleStartDate: Date, visibleEndDate: Date) => void
  /**
   * Scroll threshold for triggering onVisibleRangeChange (0–1).
   * E.g. 0.8 means fire when 80% scrolled toward an edge. Default: 0.8.
   */
  prefetchThreshold?: number
  /**
   * Optional render slots to override built-in UI (block, resource header, time label, empty cell, empty state).
   * Omitted slots fall back to the default engine rendering.
   */
  slots?: Partial<SchedulerSlots>
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
  bufferDays = 15,
  onVisibleRangeChange,
  prefetchThreshold = 0.8,
  slots: slotsProp,
}: SchedulerProps): JSX.Element {
  const parentCtx = useContext(SchedulerContext)
  const slots = slotsProp ?? {}
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
    (updater: React.SetStateAction<Block[]>) => {
      const next = typeof updater === "function" ? updater(shifts) : updater
      onShiftsChange(next)
    },
    [shifts, onShiftsChange]
  )

  const [view, setView] = useState<string>(initialView)
  const [currentDate, setCurrentDate] = useState<Date>(initialDate ?? new Date())
  /** Week view: header shows this when scrolling; buffer stays on currentDate. Null = use currentDate. */
  const [displayDateForWeekView, setDisplayDateForWeekView] = useState<Date | null>(null)
  const [selShift, setSelShift] = useState<Block | null>(null)
  const [selCategory, setSelCategory] = useState<Resource | null>(null)
  const [addCtx, setAddCtx] = useState<AddContext | null>(null)
  const [settingsOverride, setSettingsOverride] = useState<Partial<import("./types").Settings>>({})
  const [selEmps, setSelEmps] = useState<Set<string>>(
    () => new Set(employees.map((e) => e.id))
  )
  const [copiedShift, setCopiedShift] = useState<Block | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const scrollToNowRef = useRef<(() => void) | null>(null)

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))

  const onShiftClick = (s: Block, c: Resource): void => {
    setSelShift(s)
    setSelCategory(c)
  }
  const onAddShift = (
    date: Date,
    categoryId?: string | null,
    empId?: string | null
  ): void => setAddCtx({ date, categoryId, empId })
  const handleAdd = (block: Block): void =>
    setShifts((prev) => [...prev, block])

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
          date: toDateISO(wd[di]),
          status: "draft" as const,
        }
      }),
    ])
  }

  const isListView = view.startsWith("list")
  const baseView = view.replace("list", "") || "day"
  const draftCount = shifts.filter((s) => s.status === "draft").length

  const handleDeleteShift = useCallback(
    (id: string) => {
      setShifts((prev) => prev.filter((s) => s.id !== id))
      setSelShift(null)
      setSelCategory(null)
    },
    [setShifts]
  )

  const mergedConfig: SchedulerConfig = {
    ...config,
    defaultSettings: {
      ...config?.defaultSettings,
      ...settingsProp,
      ...settingsOverride,
    },
  }

  const sharedGridProps = {
    shifts,
    setShifts,
    selEmps,
    onShiftClick,
    onAddShift,
    copiedShift,
    setCopiedShift,
    zoom,
    bufferDays,
    onVisibleRangeChange,
    prefetchThreshold,
    onDeleteShift: handleDeleteShift,
    scrollToNowRef,
    initialScrollToNow: mergedConfig.initialScrollToNow ?? false,
  }

  const handleSetDate = useCallback((action: React.SetStateAction<Date>) => {
    if (typeof action === "function") {
      setCurrentDate((prev) => {
        const next = (action as (p: Date) => Date)(prev)
        setDisplayDateForWeekView(next)
        return next
      })
    } else {
      setCurrentDate(action)
      setDisplayDateForWeekView(action)
    }
  }, [])
  const handleTodayClick = (): void => handleSetDate(new Date())
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
    handleSetDate(new Date(y, m, 1))
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

  const handleSettingsChange = useCallback(
    (partial: Partial<import("./types").Settings>) => {
      setSettingsOverride((prev) => ({ ...prev, ...partial }))
    },
    []
  )

  const content = (
      <div
        className="flex h-screen flex-col overflow-hidden bg-background text-foreground"
        style={{
          fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
        }}
      >
        {draftCount > 0 && (
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-accent px-5 py-1.5">
            <span className="text-xs font-semibold text-accent-foreground">
              ✎ {draftCount} shift{draftCount !== 1 ? "s" : ""} in draft — not
              visible to staff
            </span>
            <button
              type="button"
              onClick={handlePublishAllFromBanner}
              className="cursor-pointer rounded-md border-none bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
            >
              Publish all
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 border-b border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <DateNavigator
              view={view}
              currentDate={view === "week" ? (displayDateForWeekView ?? currentDate) : currentDate}
              onDateChange={handleSetDate}
              onNavigate={navigate}
              shifts={shifts}
              slotAbove={<TodayButton onToday={handleTodayClick} />}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
          {(view === "day" || view === "week" || view === "timeline") && (
                <div className="flex items-center gap-1 mr-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleTodayClick()
                      scrollToNowRef.current?.()
                    }}
                  >
                    Now
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                    <ZoomOut size={16} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 2}>
                    <ZoomIn size={16} />
                  </Button>
                </div>
              )}
            <div className="flex w-full items-center gap-2">
              <ViewTabs view={view} setView={setView} enabledViews={mergedConfig.enabledViews} />
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
              setDate={handleSetDate}
              {...sharedGridProps}
            />
          )}
          {!isListView && baseView === "week" && (
            <WeekView
              date={currentDate}
              setDate={handleSetDate}
              onVisibleCenterChange={setDisplayDateForWeekView}
              onDateDoubleClick={(d) => {
                handleSetDate(d)
                setView("day")
              }}
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
              copiedShift={copiedShift}
              setCopiedShift={setCopiedShift}
              onDateDoubleClick={(d) => {
                handleSetDate(d)
                setView("week")
              }}
            />
          )}
          {!isListView && baseView === "year" && (
            <YearView
              date={currentDate}
              shifts={shifts}
              onMonthClick={handleMonthClick}
            />
          )}
          {!isListView && baseView === "timeline" && (
            <TimelineView
              date={currentDate}
              shifts={shifts}
              setShifts={setShifts}
              selEmps={selEmps}
              onShiftClick={onShiftClick}
              onAddShift={onAddShift}
              zoom={zoom}
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
          onDelete={handleDeleteShift}
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
      slots={slots}
    >
      {content}
    </SchedulerProvider>
  )
}
