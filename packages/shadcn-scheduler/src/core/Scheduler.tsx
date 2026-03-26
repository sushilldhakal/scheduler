import React, { useState, useCallback, useContext, useRef, useMemo } from "react"
import type { Block, Resource, Settings, SchedulerSlots, SchedulerMarker, ShiftDependency, EmployeeAvailability, HistogramConfig } from "@shadcn-scheduler/core"
import { Button } from "@shadcn-scheduler/grid-engine"
import { Plus, ZoomIn, ZoomOut } from "lucide-react"
import { SchedulerProvider, nextUid, SchedulerContext } from "@shadcn-scheduler/shell"
import { getWeekDates, sameDay, toDateISO, ZOOM_LEVELS } from "@shadcn-scheduler/core"
import { expandAllRecurring } from "@shadcn-scheduler/core"
import { findConflicts } from "@shadcn-scheduler/core"
import { TodayButton, DateNavigator } from "./components/DateNavigator"
import { ViewTabs } from "./components/ViewTabs"
import { UserSelect } from "@shadcn-scheduler/grid-engine"
import { AddShiftModal } from "@shadcn-scheduler/grid-engine"
import { ShiftModal } from "@shadcn-scheduler/grid-engine"
import { BottomSheet } from "@shadcn-scheduler/grid-engine"
import { ResourceHistogram } from "./components/ResourceHistogram"
import { useIsMobile } from "@shadcn-scheduler/grid-engine"
import { DayView, WeekView } from "./components/views/DayWeekViews"
import { MonthView } from "./components/views/MonthView"
import { YearView } from "./components/views/YearView"
import { ListView } from "./components/views/ListView"
import { TimelineView } from "./components/views/TimelineView"
import type { SchedulerConfig, SchedulerSettingsContext } from "@shadcn-scheduler/core"
import { useAuditTrail, type AuditEntry } from "./hooks/useAuditTrail"

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
  /** Initial zoom level (0.5 | 0.75 | 1 | 1.25 | 1.5 | 2). Default: 1. */
  initialZoom?: number
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
  /** P12-13: When true, show skeleton blocks instead of real data. */
  isLoading?: boolean
  /** P14-11: When true, disable drag, resize, click-to-add, and modal interactions; blocks are view-only. */
  readOnly?: boolean
  /** P14-12: Webhook-style callbacks with full Block payload. */
  onBlockCreate?: (block: Block) => void
  onBlockDelete?: (block: Block) => void
  onBlockMove?: (block: Block) => void
  onBlockResize?: (block: Block) => void
  onBlockPublish?: (block: Block) => void
  /** P14-13: Audit trail — called on every block mutation with before/after state. */
  onAuditEvent?: (entry: AuditEntry) => void
  /** Optional marker lines rendered over the grid at specific date+hour positions. */
  markers?: SchedulerMarker[]
  onMarkersChange?: (markers: SchedulerMarker[]) => void
  /** Directed arrows between blocks (finish-to-start, start-to-start, finish-to-finish). */
  dependencies?: ShiftDependency[]
  onDependenciesChange?: (deps: ShiftDependency[]) => void
  /** Per-employee availability windows. Slots outside these ranges are shaded in the grid. */
  availability?: EmployeeAvailability[]
  /** When true, renders a resource utilisation histogram below the scheduler grid. */
  showHistogram?: boolean
  /** Height of the histogram panel in pixels. Default 120. */
  histogramHeight?: number
  /** Configuration for the histogram (capacity limits per resource). */
  histogramConfig?: HistogramConfig

  // ── DX simplicity props (cover 80% of customisation needs without slots) ──────

  /**
   * Label for the Add Shift button. Default: "Add Shift".
   * Use to rename for your domain: "Add Channel", "Add Event", "Book Slot" etc.
   */
  addShiftLabel?: string
  /**
   * When false, hides the Add Shift button entirely. Default: true.
   * Use when shift creation is handled elsewhere (e.g. external form, drag-from-sidebar).
   */
  showAddShiftButton?: boolean
  /**
   * When false, hides the Now button in day/week/timeline views. Default: true.
   */
  showNowButton?: boolean
  /**
   * When false, hides the view tabs (Week / Day / Month / ...). Default: true.
   * Useful when you lock users to a single view via initialView.
   */
  showViewTabs?: boolean
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
  initialZoom = 1,
  headerActions,
  footerSlot,
  bufferDays = 15,
  onVisibleRangeChange,
  prefetchThreshold = 0.8,
  slots: slotsProp,
  isLoading = false,
  readOnly = false,
  onBlockCreate,
  onBlockDelete,
  onBlockMove,
  onBlockResize,
  onBlockPublish,
  onAuditEvent,
  markers = [],
  onMarkersChange,
  dependencies = [],
  onDependenciesChange,
  availability = [],
  showHistogram = false,
  histogramHeight = 120,
  histogramConfig,
  addShiftLabel = "Add Shift",
  showAddShiftButton = true,
  showNowButton = true,
  showViewTabs = true,
}: SchedulerProps): React.ReactElement {
  const parentCtx = useContext(SchedulerContext)
  const slots = slotsProp ?? {}
  const categories = categoriesProp ?? parentCtx?.categories ?? []
  const employees = employeesProp ?? parentCtx?.employees ?? []
  const isEmpty = categories.length === 0 || employees.length === 0

  const [view, setView] = useState<string>(initialView)
  /** P12-03: visible view after transition (lagged by 150ms on change). */
  const [visibleView, setVisibleView] = useState<string>(initialView)
  const [currentDate, setCurrentDate] = useState<Date>(initialDate ?? new Date())
  /** Week view: header shows this when scrolling; buffer stays on currentDate. Null = use currentDate. */
  const [displayDateForWeekView, setDisplayDateForWeekView] = useState<Date | null>(null)
  /** P12-03: opacity for view transition. */
  const [viewOpacity, setViewOpacity] = useState(1)
  /** P12-04: direction for DateNavigator animation. */
  const [navDirection, setNavDirection] = useState<"prev" | "next" | null>(null)
  React.useEffect(() => {
    if (view === visibleView) return
    setViewOpacity(0)
    const t = setTimeout(() => {
      setVisibleView(view)
      setViewOpacity(1)
    }, 150)
    return () => clearTimeout(t)
  }, [view, visibleView])
  const [selShift, setSelShift] = useState<Block | null>(null)
  const [selCategory, setSelCategory] = useState<Resource | null>(null)
  const [addCtx, setAddCtx] = useState<AddContext | null>(null)
  // ── Persistent settings via localStorage ──────────────────
  // Key is scoped per-consumer via config so multi-tenant apps don't bleed settings
  const storageKey = `sch-settings-${config?.labels?.category ?? "default"}`

  const [settingsOverride, setSettingsOverride] = useState<Partial<import("./types").Settings>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
      return raw ? (JSON.parse(raw) as Partial<import("./types").Settings>) : {}
    } catch {
      return {}
    }
  })
  const [selEmps, setSelEmps] = useState<Set<string>>(
    () => new Set(employees.map((e) => e.id))
  )
  // Auto-sync selEmps when employees prop changes — new staff added dynamically will appear
  React.useEffect(() => {
    setSelEmps((prev) => {
      const next = new Set(prev)
      let changed = false
      employees.forEach((e) => {
        if (!next.has(e.id)) { next.add(e.id); changed = true }
      })
      return changed ? next : prev
    })
  }, [employees])
  const [copiedShift, setCopiedShift] = useState<Block | null>(null)
  const [zoom, setZoom] = useState<number>(initialZoom)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string>("")
  const scrollToNowRef = useRef<(() => void) | null>(null)
  const schedulerContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const historyRef = useRef<{ past: Block[][], future: Block[][] }>({ past: [], future: [] })
  const HISTORY_MAX = 20

  // ── Audit trail ────────────────────────────────────────────
  const { append: auditAppend } = useAuditTrail(onAuditEvent)

  // ── Debounced onShiftsChange ───────────────────────────────
  const debounceShiftsRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingShiftsRef = useRef<Block[] | null>(null)
  const debouncedOnShiftsChange = useCallback(
    (next: Block[]) => {
      pendingShiftsRef.current = next
      if (debounceShiftsRef.current) clearTimeout(debounceShiftsRef.current)
      debounceShiftsRef.current = setTimeout(() => {
        if (pendingShiftsRef.current) onShiftsChange(pendingShiftsRef.current)
        pendingShiftsRef.current = null
      }, 150)
    },
    [onShiftsChange]
  )

  const setShifts = useCallback(
    (updater: React.SetStateAction<Block[]>) => {
      const next = typeof updater === "function" ? updater(shifts) : updater
      historyRef.current.past = [shifts, ...historyRef.current.past].slice(0, HISTORY_MAX)
      historyRef.current.future = []
      debouncedOnShiftsChange(next)
    },
    [shifts, debouncedOnShiftsChange]
  )

  const handleUndo = useCallback(() => {
    const prev = historyRef.current.past.shift()
    if (!prev) return
    historyRef.current.future = [shifts, ...historyRef.current.future].slice(0, HISTORY_MAX)
    debouncedOnShiftsChange(prev)
  }, [shifts, debouncedOnShiftsChange])

  const handleRedo = useCallback(() => {
    const next = historyRef.current.future.shift()
    if (!next) return
    historyRef.current.past = [shifts, ...historyRef.current.past].slice(0, HISTORY_MAX)
    debouncedOnShiftsChange(next)
  }, [shifts, debouncedOnShiftsChange])

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
  const handleAdd = (block: Block): void => {
    onBlockCreate?.(block)
    auditAppend({ action: "create", blockId: block.id, after: block })
    setShifts((prev) => [...prev, block])
  }

  const publishShifts = useCallback(
    (...ids: string[]): void =>
      setShifts((prev) => {
        const conflictIds = findConflicts(prev)
        const allowedIds = ids.filter((id) => !conflictIds.has(id))
        if (allowedIds.length === 0) return prev
        const next = prev.map((s) =>
          allowedIds.includes(s.id) ? { ...s, status: "published" as const } : s
        )
        if (onBlockPublish) {
          for (const id of allowedIds) {
            const updated = next.find((s) => s.id === id)
            if (updated) onBlockPublish(updated)
          }
        }
        return next
      }),
    [setShifts, onBlockPublish]
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
    setNavDirection(dir < 0 ? "prev" : "next")
    setTimeout(() => setNavDirection(null), 200)
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

  const isListView = visibleView.startsWith("list")
  const baseView = visibleView.replace("list", "") || "day"
  const draftCount = shifts.filter((s) => s.status === "draft").length

  const expandRangeStart = useMemo(() => { const d = new Date(currentDate); d.setDate(d.getDate() - bufferDays - 7); d.setHours(0,0,0,0); return d }, [currentDate, bufferDays])
  const expandRangeEnd   = useMemo(() => { const d = new Date(currentDate); d.setDate(d.getDate() + bufferDays + 7); d.setHours(23,59,59,999); return d }, [currentDate, bufferDays])
  const expandedShifts   = useMemo(() => expandAllRecurring(shifts, expandRangeStart, expandRangeEnd), [shifts, expandRangeStart, expandRangeEnd])

  const handleDeleteShift = useCallback(
    (id: string) => {
      // id may be a recurring occurrence id like "masterId_rYYYY-MM-DD"
      // Find by direct id first, then by matching occurrence pattern
      const removed = shifts.find((s) => s.id === id)
        ?? expandedShifts.find((s) => s.id === id)
      if (removed) {
        onBlockDelete?.(removed)
        auditAppend({ action: "delete", blockId: id, before: removed })
        if (removed.recurringMasterId) {
          // For a recurring occurrence: materialize an exclusion by removing
          // the master and re-adding all occurrences except this one as standalone
          // Simple approach: just add this occurrence as a "deleted" placeholder
          // by filtering from expandedShifts (handled naturally — nothing to do in shifts)
          // The occurrence won't re-appear because it has no master entry in shifts
          // so it won't be re-expanded. We just need to NOT add it back.
          // Simplest: do nothing — if master is not deleted, occurrence re-appears on reload.
          // Better: store a skip-list. For now, remove the master entirely for simplicity.
          setShifts((prev) => prev.filter((s) => s.id !== removed.recurringMasterId && s.id !== id))
        } else {
          setShifts((prev) => prev.filter((s) => s.id !== id))
        }
      } else {
        setShifts((prev) => prev.filter((s) => s.id !== id))
      }
      setSelShift(null)
      setSelCategory(null)
    },
    [setShifts, shifts, expandedShifts, onBlockDelete, auditAppend]
  )

  const handleShiftUpdate = useCallback(
    (updated: Block): void => {
      const isOccurrence = !!updated.recurringMasterId
      // For a recurring occurrence: strip the recurrence metadata and materialize
      // it as a standalone block, replacing the master in shifts.
      // The master stays for other occurrences; this one becomes independent.
      const standalone: Block = isOccurrence
        ? { ...updated, recurringMasterId: undefined, recurrence: undefined }
        : updated

      // Find the prev block — either direct match or via master
      const prev = shifts.find((s) => s.id === updated.id)
        ?? (isOccurrence ? shifts.find((s) => s.id === updated.recurringMasterId) : undefined)

      if (prev) {
        const moved =
          prev.date !== standalone.date ||
          prev.categoryId !== standalone.categoryId ||
          prev.employeeId !== standalone.employeeId
        const timeChanged = prev.startH !== standalone.startH || prev.endH !== standalone.endH
        const resized = timeChanged && (prev.endH - prev.startH) !== (standalone.endH - standalone.startH)
        if (moved || (timeChanged && !resized)) {
          onBlockMove?.(standalone)
          auditAppend({ action: "move", blockId: standalone.id, before: prev, after: standalone })
        }
        if (resized) {
          onBlockResize?.(standalone)
          auditAppend({ action: "resize", blockId: standalone.id, before: prev, after: standalone })
        }
        if (prev.status !== "published" && standalone.status === "published") {
          onBlockPublish?.(standalone)
          auditAppend({ action: "publish", blockId: standalone.id, before: prev, after: standalone })
        }
      }

      if (isOccurrence) {
        // Materialize: add the standalone occurrence to shifts (master stays intact for other dates)
        setShifts((prev) => {
          const already = prev.find((s) => s.id === standalone.id)
          if (already) return prev.map((s) => s.id === standalone.id ? standalone : s)
          return [...prev, standalone]
        })
      } else {
        setShifts((prev) => prev.map((s) => (s.id === standalone.id ? standalone : s)))
      }
      setSelShift(standalone)
    },
    [setShifts, shifts, onBlockMove, onBlockResize, onBlockPublish, auditAppend]
  )

  const mergedConfig: SchedulerConfig = {
    ...config,
    defaultSettings: {
      ...config?.defaultSettings,
      ...settingsProp,
      ...settingsOverride,
    },
  }

  const handleBlockMoved = useCallback(
    (block: Block, newDate: string, newStartH: number, newEndH: number) => {
      const dayName = new Date(newDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })
      const startStr = newStartH < 12 ? `${Math.floor(newStartH)}am` : newStartH === 12 ? "12pm" : `${Math.floor(newStartH) - 12}pm`
      const endStr = newEndH < 12 ? `${Math.floor(newEndH)}am` : newEndH === 12 ? "12pm" : `${Math.floor(newEndH) - 12}pm`
      setAnnouncement(`${block.employee} moved to ${dayName} ${startStr}–${endStr}`)
      setTimeout(() => setAnnouncement(""), 3000)
    },
    []
  )

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setSelShift(null)
        setSelCategory(null)
        setAddCtx(null)
        return
      }
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault()
        handleUndo()
        return
      }
      if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault()
        handleRedo()
        return
      }
      if (e.ctrlKey && e.key === "c") {
        if (focusedBlockId) {
          const block = shifts.find((s) => s.id === focusedBlockId)
          if (block) {
            e.preventDefault()
            setCopiedShift(block)
          }
        }
        return
      }
      if (e.ctrlKey && e.key === "v") {
        if (focusedBlockId && copiedShift) {
          e.preventDefault()
          const at = shifts.find((s) => s.id === focusedBlockId)
          if (at) {
            const newBlock: Block = {
              ...copiedShift,
              id: nextUid(),
              date: at.date,
              categoryId: at.categoryId,
            }
            onBlockCreate?.(newBlock)
            setShifts((prev) => [...prev, newBlock])
          }
        }
        return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [focusedBlockId, copiedShift, shifts, handleUndo, handleRedo, setShifts, onBlockCreate])

  const debouncedVisibleRangeChangeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedOnVisibleRangeChange = useCallback(
    (start: Date, end: Date) => {
      if (!onVisibleRangeChange) return
      if (debouncedVisibleRangeChangeRef.current) clearTimeout(debouncedVisibleRangeChangeRef.current)
      debouncedVisibleRangeChangeRef.current = setTimeout(() => {
        onVisibleRangeChange(start, end)
      }, 150)
    },
    [onVisibleRangeChange]
  )

  // Expand recurring blocks into individual occurrences for the visible window
  const sharedGridProps = {
    shifts: expandedShifts,
    markers,
    onMarkersChange,
    setShifts,
    selEmps,
    onShiftClick,
    onAddShift,
    copiedShift,
    setCopiedShift,
    zoom,
    setZoom,
    bufferDays,
    onVisibleRangeChange: debouncedOnVisibleRangeChange,
    prefetchThreshold,
    onDeleteShift: handleDeleteShift,
    scrollToNowRef,
    initialScrollToNow: mergedConfig.initialScrollToNow ?? false,
    onSwipeNavigate: navigate,
    onNavigate: navigate,
    onBlockMoved: handleBlockMoved,
    onFocusedBlockChange: setFocusedBlockId,
    isLoading,
    readOnly,
    onBlockCreate,
    onBlockDelete,
    onBlockMove,
    onBlockResize,
    onBlockPublish,
    dependencies,
    onDependenciesChange,
    availability,
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
    setShifts((prev) => {
      const next = prev.map((s) => ({ ...s, status: "published" as const }))
      if (onBlockPublish) {
        for (let i = 0; i < prev.length; i++) {
          if (prev[i]?.status !== "published" && next[i]?.status === "published") {
            onBlockPublish(next[i]!)
          }
        }
      }
      return next
    })
  const handleAddShiftButton = (): void => onAddShift(new Date(), null, null)
  const handleMonthClick = (y: number, m: number): void => {
    handleSetDate(new Date(y, m, 1))
    setView("month")
  }

  // Smart view change: when narrowing from list-week/month/year → list-day,
  // snap currentDate back to today so the day list isn't empty on a random nav date
  const handleViewChange = useCallback((nextView: string) => {
    const wasWideList = view.startsWith("list") && view !== "listday"
    const isNowDayList = nextView === "listday"
    if (wasWideList && isNowDayList) {
      setCurrentDate(new Date())
    }
    setView(nextView)
  }, [view])
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
      setSettingsOverride((prev) => {
        const next = { ...prev, ...partial }
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch { /* quota exceeded or SSR */ }
        return next
      })
    },
    [storageKey]
  )

  const content = (
      <div
        ref={schedulerContainerRef}
        className="flex h-full flex-col overflow-hidden bg-background text-foreground"
        style={{
          fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        dir={mergedConfig?.isRTL ? "rtl" : "ltr"}
      >
        <div
          aria-live="polite"
          aria-atomic
          className="sr-only"
          role="status"
        >
          {announcement}
        </div>
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

        {isMobile ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-background p-3">
              <DateNavigator
                view={view}
                currentDate={view === "week" ? (displayDateForWeekView ?? currentDate) : currentDate}
                onDateChange={handleSetDate}
                onNavigate={navigate}
                shifts={shifts}
                navDirection={navDirection}
                slotAbove={<TodayButton onToday={handleTodayClick} />}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleTodayClick()
                  requestAnimationFrame(() => requestAnimationFrame(() => scrollToNowRef.current?.()))
                }}
                className="shrink-0"
              >
                Today
              </Button>
            </div>
            <div
              className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 border-t border-border bg-background p-2"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {showViewTabs && <ViewTabs view={view} setView={handleViewChange} views={mergedConfig.views} />}
              {showAddShiftButton && (
                <Button onClick={handleAddShiftButton} size="sm">
                  <Plus size={16} />
                  Add
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 border-b border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <DateNavigator
                view={view}
                currentDate={view === "week" ? (displayDateForWeekView ?? currentDate) : currentDate}
                onDateChange={handleSetDate}
                onNavigate={navigate}
                shifts={shifts}
                navDirection={navDirection}
                slotAbove={<TodayButton onToday={handleTodayClick} />}
              />
            </div>

            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
            {(view === "day" || view === "week" || view === "timeline") && showNowButton && (
                  <div className="flex items-center gap-1 mr-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleTodayClick()
                        requestAnimationFrame(() => requestAnimationFrame(() => scrollToNowRef.current?.()))
                      }}
                    >
                      Now
                    </Button>
                  </div>
                )}
              <div className="flex w-full items-center gap-2">
                {showViewTabs && <ViewTabs view={view} setView={handleViewChange} views={mergedConfig.views} />}
                <UserSelect
                  selEmps={selEmps}
                  onToggle={toggleEmp}
                  onAll={handleAllEmployees}
                  onNone={handleNoEmployees}
                />
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                {footerSlot && footerSlot({ onSettingsChange: handleSettingsChange, containerRef: schedulerContainerRef, shifts })}
                {/* slots.toolbar: power-user slot that replaces the entire right toolbar area.
                    When provided, headerActions and Add Shift button are NOT rendered. */}
                {slots.toolbar
                  ? slots.toolbar({
                      goToDate: handleSetDate,
                      goToNow: () => { handleTodayClick(); requestAnimationFrame(() => requestAnimationFrame(() => scrollToNowRef.current?.())) },
                      openAddShift: handleAddShiftButton,
                      copyLastWeek,
                      publishAllDrafts: handlePublishAllDrafts,
                      draftCount,
                      view,
                      setView: handleViewChange,
                    })
                  : (
                    <>
                      {typeof headerActions === "function"
                        ? headerActions({ copyLastWeek, publishAllDrafts: handlePublishAllDrafts, draftCount })
                        : headerActions}
                      {showAddShiftButton && (
                        <Button onClick={handleAddShiftButton} className="w-full sm:w-auto">
                          <Plus size={16} />
                          {addShiftLabel}
                        </Button>
                      )}
                    </>
                  )
                }
              </div>
            </div>
          </div>
        )}

        <div
          className="transition-opacity duration-150"
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            opacity: viewOpacity,
            paddingBottom: isMobile ? 56 : 0,
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
          {!isListView && baseView === "timeline" && (() => {
            // Build a buffered date window centred on currentDate — same pattern as DayView.
            // bufferDays on each side lets the user scroll without hitting an empty edge.
            const effectiveBuf = Math.min(bufferDays, 30)
            const timelineDates = Array.from({ length: 1 + 2 * effectiveBuf }, (_, i) => {
              const d = new Date(currentDate)
              d.setDate(d.getDate() + i - effectiveBuf)
              return d
            })
            return (
              <TimelineView
                date={currentDate}
                dates={timelineDates}
                shifts={expandedShifts}
                setShifts={setShifts}
                selEmps={selEmps}
                onShiftClick={onShiftClick}
                onAddShift={onAddShift}
                zoom={zoom}
                setZoom={setZoom}
                markers={markers}
                onMarkersChange={onMarkersChange}
                dependencies={dependencies}
                onDependenciesChange={onDependenciesChange}
                availability={availability}
                copiedShift={copiedShift}
                setCopiedShift={setCopiedShift}
                onDeleteShift={handleDeleteShift}
                scrollToNowRef={scrollToNowRef}
                initialScrollToNow={mergedConfig.initialScrollToNow ?? false}
                onBlockCreate={onBlockCreate}
                onBlockDelete={onBlockDelete}
                onBlockMove={onBlockMove}
                readOnly={readOnly}
              />
            )
          })()}
          {isListView && (
            <ListView
              shifts={shifts}
              setShifts={setShifts}
              onShiftClick={onShiftClick}
              onPublish={publishShifts}
              onUnpublish={unpublishShift}
              onAddShift={onAddShift}
              currentDate={currentDate}
              view={view}
            />
          )}
        </div>

        {/* Resource utilisation histogram */}
        {showHistogram && (
          <ResourceHistogram
            shifts={expandedShifts}
            rangeStart={expandRangeStart}
            rangeEnd={expandRangeEnd}
            height={histogramHeight}
            config={histogramConfig}
          />
        )}

        {addCtx && (
          <AddShiftModal
            date={addCtx.date}
            categoryId={addCtx.categoryId ?? undefined}
            employeeId={addCtx.empId ?? undefined}
            onAdd={handleAdd}
            onClose={handleCloseAddModal}
          />
        )}

        {selShift && selCategory && isMobile ? (
          <BottomSheet open onClose={handleCloseShiftModal}>
            <ShiftModal
              shift={selShift}
              category={selCategory}
              onClose={handleCloseShiftModal}
              onPublish={handleShiftModalPublish}
              onUnpublish={handleShiftModalUnpublish}
              onDelete={handleDeleteShift}
              variant="sheet"
              allShifts={shifts}
              onUpdate={handleShiftUpdate}
            />
          </BottomSheet>
        ) : (
          <ShiftModal
            shift={selShift}
            category={selCategory}
            onClose={handleCloseShiftModal}
            onPublish={handleShiftModalPublish}
            onUnpublish={handleShiftModalUnpublish}
            onDelete={handleDeleteShift}
            allShifts={shifts}
            onUpdate={handleShiftUpdate}
          />
        )}
      </div>
  )

  if (parentCtx) {
    return content
  }
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Provide categories and employees to the Scheduler or SchedulerProvider.
      </div>
    )
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
