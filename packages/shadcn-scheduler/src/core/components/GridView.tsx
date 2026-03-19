import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import type { Block, Resource } from "../types"
import { useSchedulerContext } from "../context"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  SNAP,
  SIDEBAR_W,
  SHIFT_H,
  ROLE_HDR,
  HOUR_HDR_H,
  ADD_BTN_H,
  DAY_SCROLL_BUFFER,
  WEEK_TIME_LABEL_GAP,
  DOW_MON_FIRST,
  MONTHS_SHORT,
  snapH,
  snapToInterval,
  clamp,
  sameDay,
  isToday,
  fmt12,
  hourBg,
  isOutsideWorkingHours,
  DASHED_BG,
  getWeekDates,
  toDateISO,
  parseBlockDate,
  LONG_PRESS_DELAY_MS,
  LONG_PRESS_MOVE_THRESHOLD_PX,
  SWIPE_MIN_DELTA_X_PX,
  SWIPE_MAX_DELTA_Y_PX,
  RESIZE_HANDLE_MIN_TOUCH_PX,
  ZOOM_LEVELS,
} from "../constants"
import { packShifts, getCategoryRowHeight, findConflicts, getConflictCount, wouldConflictAt } from "../utils/packing"
import { useScrollToNow } from "../hooks/useScrollToNow"
import { useMediaQuery, useIsTablet } from "../hooks/useMediaQuery"
import { useFlatRows } from "../hooks/useFlatRows"
import type { FlatRow } from "../types"
import { StaffPanel } from "./StaffPanel"
import { RoleWarningModal } from "./modals/RoleWarningModal"
import { AddShiftModal } from "./modals/AddShiftModal"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel, ContextMenuTrigger } from "./ui/context-menu"
import { Plus, Copy, ClipboardPaste, Trash2, AlertTriangle, Pencil, Scissors } from "lucide-react"
import { cn } from "../lib/utils"

interface DragState {
  type: "move" | "resize-left" | "resize-right"
  id: string
  sx: number
  sy: number
  startH: number
  endH: number
  categoryId: string
  empId: string
  dur: number
  blockEl: HTMLElement | null
  blockColor: string
  /** Where inside the block the pointer landed — stored once at pointerdown to avoid per-frame reflows */
  grabOffsetX: number
  grabOffsetY: number
  /** Scroll container rect captured at drag start — stable until drag ends */
  gridRect: DOMRect | null
}

interface GridViewProps {
  dates: Date[]
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  isWeekView?: boolean
  setDate?: React.Dispatch<React.SetStateAction<Date>>
  /** Day view with multiple days: [Mon 7-5pm][Tue 7-5pm]... horizontal scroll */
  isDayViewMultiDay?: boolean
  /** The date that should be centered/focused (e.g. from calendar pick) */
  focusedDate?: Date
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  zoom?: number
  /** Double-click on date header (week view) switches to day view */
  onDateDoubleClick?: (date: Date) => void
  /** Week view: report visible center date for header only (does not change buffer). */
  onVisibleCenterChange?: (date: Date) => void
  /** Called when user scrolls near edge; use for prefetching. */
  onVisibleRangeChange?: (visibleStartDate: Date, visibleEndDate: Date) => void
  /** Scroll threshold (0–1) for firing onVisibleRangeChange. Default 0.8 */
  prefetchThreshold?: number
  /** Called when user confirms delete from the grid (after confirm dialog). */
  onDeleteShift?: (shiftId: string) => void
  /** Ref to receive scrollToNow() for the header Now button. */
  scrollToNowRef?: React.MutableRefObject<(() => void) | null>
  /** When true, scroll to current time on mount (day/week view). */
  initialScrollToNow?: boolean
  /** P12-13: When true, show skeleton blocks (same layout as real data). */
  isLoading?: boolean
  /** Swipe on grid background: call with 1 or -1 to navigate. */
  onSwipeNavigate?: (dir: number) => void
  /** Pinch zoom: call with new zoom level (from ZOOM_LEVELS). */
  onPinchZoom?: (zoom: number) => void
  /** Current zoom level for pinch (0.5–2). */
  setZoom?: React.Dispatch<React.SetStateAction<number>>
  /** Mobile: show only one resource (category) at a time; index into categories. */
  mobileResourceIndex?: number
  /** Mobile: called when user swipes/clicks to prev/next resource (dir is -1 or 1). */
  onMobileResourceChange?: (dir: number) => void
  /** Keyboard: when no block focused, Arrow Left/Right calls this to navigate. */
  onNavigate?: (dir: number) => void
  /** Called after a block is moved (for aria-live announcement). */
  onBlockMoved?: (block: Block, newDate: string, newStartH: number, newEndH: number) => void
  /** Called when block focus changes (for Scheduler Ctrl+C / Ctrl+V). */
  onFocusedBlockChange?: (blockId: string | null) => void
  /** When true, disable drag, resize, click-to-add; view-only. */
  readOnly?: boolean
  /** P14-12: Webhook-style callbacks with full Block payload. */
  onBlockCreate?: (block: Block) => void
  onBlockDelete?: (block: Block) => void
  onBlockMove?: (block: Block) => void
  onBlockResize?: (block: Block) => void
  onBlockPublish?: (block: Block) => void
}

interface StaffPanelState {
  categoryId: string
  anchorRect: DOMRect
}

interface DropHoverState {
  categoryId: string
  di?: number
  hour?: number
}

interface CategoryWarnState {
  shift?: Block
  newCategoryId?: string
  ns?: number
  ne?: number
  newDate?: string
  empName?: string
  fromCategory?: Resource
  toCategory?: Resource
  onConfirmAction?: () => void
}

interface AddPromptState {
  date: Date
  categoryId: string
  hour: number
  employeeId?: string
}

function GridViewInner({
  dates,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  isWeekView,
  setDate,
  isDayViewMultiDay = false,
  focusedDate,
  copiedShift,
  setCopiedShift,
  zoom = 1,
  onDateDoubleClick,
  onVisibleCenterChange,
  onVisibleRangeChange,
  prefetchThreshold = 0.8,
  onDeleteShift,
  scrollToNowRef,
  initialScrollToNow = false,
  isLoading = false,
  readOnly = false,
  onSwipeNavigate,
  onPinchZoom,
  setZoom,
  mobileResourceIndex,
  onMobileResourceChange,
  onNavigate,
  onBlockMoved,
  onFocusedBlockChange,
  onBlockCreate,
  onBlockDelete,
  onBlockMove,
  onBlockResize,
  onBlockPublish,
}: GridViewProps): React.ReactElement {
  const { categories, employees, nextUid, getColor, labels, settings, slots, snapMinutes, getTimeLabel } = useSchedulerContext()
  const CATEGORIES =
    mobileResourceIndex !== undefined && onMobileResourceChange
      ? [categories[mobileResourceIndex]].filter(Boolean)
      : categories
  const isMobileSingleResource = mobileResourceIndex !== undefined && onMobileResourceChange
  const isTouchDevice = useMediaQuery("(pointer: coarse)")
  const isTablet = useIsTablet()
  const snapHours = (snapMinutes ?? 30) / 60
  const snapLocal = useCallback(
    (v: number) => snapToInterval(v, snapHours),
    [snapHours]
  )
  const ALL_EMPLOYEES = employees

  const HOUR_W = 88 * zoom

  const scrollRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const initRef = useRef<boolean>(false)
  const lastReportedDayIdxRef = useRef<number>(-1)
  const scrollTriggeredUpdateRef = useRef(false)
  const lastReportedRangeRef = useRef<{ start: number; end: number } | null>(null)

  /** Row highlighted during block drag — set by drag engine via onHoverCategory */
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  /** Resizable sidebar width */
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_W)
  const sidebarDragRef = useRef<{ startX: number; startW: number } | null>(null)
  /** Sort: "name" | "hours" | "scheduled" | null */
  const [sortBy, setSortBy] = useState<"name" | "hours" | "scheduled" | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  /** Multi-select: set of selected block IDs */
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())

  const [staffPanel, setStaffPanel] = useState<StaffPanelState | null>(null)
  const staffDragRef = useRef<{ empId: string; fromCategoryId: string; empName: string; pointerId: number } | null>(null)
  const [dragEmpId, setDragEmpId] = useState<string | null>(null)
  const [isStaffDragging, setIsStaffDragging] = useState(false)
  const [dropHover, setDropHover] = useState<DropHoverState | null>(null)
  const [categoryWarn, setCategoryWarn] = useState<CategoryWarnState | null>(null)
  const [addPrompt, setAddPrompt] = useState<AddPromptState | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [shiftToDeleteConfirm, setShiftToDeleteConfirm] = useState<Block | null>(null)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const blockRefsRef = useRef<Record<string, HTMLDivElement | null>>({})
  /** P12-01: IDs of blocks just added (one-frame scale-in animation). */
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
  /** P12-02: IDs of blocks being deleted (fade-out then remove). */
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  /** P12-23: ID of block that was dropped into a conflicting position (show red, revert). */
  const [dropConflictId, setDropConflictId] = useState<string | null>(null)
  /** P12-10: Block hover tooltip after 200ms (or immediately when hovering conflict icon). */
  const [tooltipBlockId, setTooltipBlockId] = useState<string | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const TOOLTIP_HOVER_MS = 200
  const TOOLTIP_LEAVE_MS = 150
  const prevShiftsRef = useRef<Block[]>(shifts)
  useEffect(() => {
    const prevIds = new Set(prevShiftsRef.current.map((s) => s.id))
    const added = shifts.filter((s) => !prevIds.has(s.id)).map((s) => s.id)
    if (added.length) {
      setNewlyAddedIds((prev) => new Set([...prev, ...added]))
      const raf = requestAnimationFrame(() => setNewlyAddedIds(new Set()))
      return () => cancelAnimationFrame(raf)
    }
    prevShiftsRef.current = shifts
  }, [shifts])
  useEffect(() => {
    prevShiftsRef.current = shifts
  })

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Sidebar resize ──────────────────────────────────────────
  const onSidebarResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    sidebarDragRef.current = { startX: e.clientX, startW: sidebarWidth }
  }, [sidebarWidth])

  const onSidebarResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!sidebarDragRef.current) return
    const delta = e.clientX - sidebarDragRef.current.startX
    setSidebarWidth(Math.max(120, Math.min(400, sidebarDragRef.current.startW + delta)))
  }, [])

  const onSidebarResizeEnd = useCallback(() => {
    sidebarDragRef.current = null
  }, [])

  // ── Sidebar sort ────────────────────────────────────────────
  const toggleSort = useCallback((col: "name" | "hours" | "scheduled") => {
    if (sortBy === col) {
      // Same column — flip direction
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      // New column — set it and reset to asc
      setSortBy(col)
      setSortDir("asc")
    }
  }, [sortBy])

  // ── Multi-select ────────────────────────────────────────────
  const toggleBlockSelect = useCallback((id: string, multi: boolean) => {
    setSelectedBlockIds((prev) => {
      if (!multi) return new Set(prev.has(id) && prev.size === 1 ? [] : [id])
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const deleteSelectedBlocks = useCallback(() => {
    if (!onDeleteShift) return
    selectedBlockIds.forEach((id) => onDeleteShift(id))
    setSelectedBlockIds(new Set())
  }, [selectedBlockIds, onDeleteShift])

  const COL_W_WEEK = useMemo((): number => {
    if (!isWeekView) return HOUR_W
    const vh = settings.visibleTo - settings.visibleFrom
    return Math.max(vh * 18, 160) * zoom
  }, [isWeekView, settings, zoom, HOUR_W])

  const PX_WEEK = isWeekView ? COL_W_WEEK / Math.max(settings.visibleTo - settings.visibleFrom, 1) : 1
  /** Day view: 0.5 = 30-min slots when zoomed in, 1 = hourly */
  const dayTimeStep = zoom >= 1.25 ? 0.5 : 1
  /** Week view: 1h when zoomed in, 2h at default, 4h when zoomed out (narrow column) */
  const weekTimeLabelGap = !isWeekView
    ? WEEK_TIME_LABEL_GAP
    : zoom >= 1.25
      ? 1
      : zoom >= 0.8
        ? 2
        : 4
  const DAY_VISIBLE_SLOTS = useMemo(() => {
    const count = Math.round((settings.visibleTo - settings.visibleFrom) / dayTimeStep)
    return Array.from({ length: count }, (_, k) => settings.visibleFrom + k * dayTimeStep)
  }, [settings.visibleFrom, settings.visibleTo, dayTimeStep])
  const SLOT_W = HOUR_W * dayTimeStep
  const DAY_WIDTH = (settings.visibleTo - settings.visibleFrom) * HOUR_W
  const hasDayScrollNav = !isWeekView && !!setDate && !isDayViewMultiDay
  const TOTAL_W = isWeekView
    ? dates.length * COL_W_WEEK
    : isDayViewMultiDay
      ? dates.length * DAY_WIDTH
      : hasDayScrollNav
        ? 2 * DAY_SCROLL_BUFFER + DAY_WIDTH
        : DAY_WIDTH

  const isDayViewNav = isWeekView && dates.length === 7
  const scrollNavDelta = isDayViewNav ? 1 : 7
  const scrollNavCols = isDayViewNav ? 1 : 7
  const weekViewScrollCol = useMemo((): number => {
    if (!isWeekView || dates.length === 0) return 7
    if (isDayViewNav) return 3
    if (focusedDate) {
      const weekStart = getWeekDates(focusedDate)[0]
      const idx = dates.findIndex((d) => sameDay(d, weekStart))
      if (idx >= 0) return idx
    }
    return Math.floor(dates.length / 2) - 3
  }, [isWeekView, isDayViewNav, dates, focusedDate])
  const centerDayIdx = isDayViewMultiDay ? Math.floor(dates.length / 2) : 0
  useEffect(() => {
    if (!initRef.current && scrollRef.current) {
      const performScroll = (): void => {
        if (!scrollRef.current || initRef.current) return
        if (isWeekView) {
          scrollRef.current.scrollLeft = weekViewScrollCol * COL_W_WEEK
        } else if (hasDayScrollNav) {
          scrollRef.current.scrollLeft = DAY_SCROLL_BUFFER
        } else if (isDayViewMultiDay) {
          const vw = scrollRef.current.clientWidth
          scrollRef.current.scrollLeft = Math.max(0, centerDayIdx * DAY_WIDTH + DAY_WIDTH / 2 - vw / 2)
        } else {
          scrollRef.current.scrollLeft = 0
        }
        if (headerRef.current) {
          headerRef.current.scrollLeft = scrollRef.current.scrollLeft
        }
        if (sidebarRef.current) {
          sidebarRef.current.scrollTop = scrollRef.current.scrollTop
        }
        initRef.current = true
        lastReportedDayIdxRef.current = centerDayIdx
      }
      // Defer so layout is complete; rAF + rAF helps ensure layout has been painted
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(performScroll)
      })
      return () => cancelAnimationFrame(id)
    }
  }, [isWeekView, hasDayScrollNav, isDayViewMultiDay, weekViewScrollCol, COL_W_WEEK, centerDayIdx, DAY_WIDTH])

  const prevDatesRef = useRef(dates)
  React.useLayoutEffect(() => {
    if (prevDatesRef.current !== dates) {
      const oldDates = prevDatesRef.current
      prevDatesRef.current = dates
      if (oldDates.length > 0 && dates.length > 0 && scrollRef.current) {
        if (scrollTriggeredUpdateRef.current) {
          // Edge load: preserve scroll position relative to content
          const diffDays = Math.round((dates[0].getTime() - oldDates[0].getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays !== 0) {
            if (isDayViewMultiDay) {
              scrollRef.current.scrollLeft -= diffDays * DAY_WIDTH
            } else if (isWeekView) {
              scrollRef.current.scrollLeft -= diffDays * COL_W_WEEK
            }
            if (headerRef.current) headerRef.current.scrollLeft = scrollRef.current.scrollLeft
            if (sidebarRef.current) sidebarRef.current.scrollTop = scrollRef.current.scrollTop
          }
          scrollTriggeredUpdateRef.current = false
        } else {
          // Navigated via header buttons, reset scroll to center (week: to focused week; day: to focused day)
          if (isWeekView) {
            scrollRef.current.scrollLeft = weekViewScrollCol * COL_W_WEEK
          } else if (hasDayScrollNav) {
            scrollRef.current.scrollLeft = DAY_SCROLL_BUFFER
          } else if (isDayViewMultiDay) {
            const vw = scrollRef.current.clientWidth
            scrollRef.current.scrollLeft = Math.max(0, centerDayIdx * DAY_WIDTH + DAY_WIDTH / 2 - vw / 2)
          }
          if (headerRef.current) headerRef.current.scrollLeft = scrollRef.current.scrollLeft
          if (sidebarRef.current) sidebarRef.current.scrollTop = scrollRef.current.scrollTop
        }
      }
    }
  }, [dates, isDayViewMultiDay, isWeekView, hasDayScrollNav, weekViewScrollCol, centerDayIdx, DAY_WIDTH, COL_W_WEEK])

  const focusedDateTime = focusedDate?.getTime()
  useEffect(() => {
    if (!isDayViewMultiDay || !scrollRef.current || !focusedDate || dates.length === 0) return
    if (scrollTriggeredUpdateRef.current) {
      scrollTriggeredUpdateRef.current = false
      return
    }
    const idx = dates.findIndex((d) => d.getTime() === focusedDateTime)
    if (idx < 0) return
    const vw = scrollRef.current.clientWidth
    const targetScroll = Math.max(0, idx * DAY_WIDTH + DAY_WIDTH / 2 - vw / 2)
    scrollRef.current.scrollLeft = targetScroll
    if (headerRef.current) {
      headerRef.current.scrollLeft = scrollRef.current.scrollLeft
    }
    lastReportedDayIdxRef.current = idx
  }, [isDayViewMultiDay, focusedDateTime, dates, DAY_WIDTH])

  const VISIBLE_RANGE_DEBOUNCE_MS = 100
  const visibleRangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reportVisibleRange = useCallback(
    (el: HTMLDivElement, forceReport = false): void => {
      if (!onVisibleRangeChange || dates.length === 0 || !(isWeekView || isDayViewMultiDay)) return
      const colW = isWeekView ? COL_W_WEEK : DAY_WIDTH
      const maxScroll = el.scrollWidth - el.clientWidth
      const firstIdx = clamp(Math.floor(el.scrollLeft / colW), 0, dates.length - 1)
      const lastIdx = clamp(
        Math.floor((el.scrollLeft + el.clientWidth) / colW),
        0,
        dates.length - 1
      )
      const startT = dates[firstIdx].getTime()
      const endT = dates[lastIdx].getTime()
      if (!forceReport && maxScroll > 0) {
        const scrollRatio = el.scrollLeft / maxScroll
        const nearRight = scrollRatio >= prefetchThreshold
        const nearLeft = scrollRatio <= 1 - prefetchThreshold
        if (!nearRight && !nearLeft) return
      }
      const last = lastReportedRangeRef.current
      if (!forceReport && last && last.start === startT && last.end === endT) return
      lastReportedRangeRef.current = { start: startT, end: endT }
      const fire = (): void => {
        onVisibleRangeChange(new Date(dates[firstIdx]), new Date(dates[lastIdx]))
      }
      if (forceReport) {
        if (visibleRangeDebounceRef.current) {
          clearTimeout(visibleRangeDebounceRef.current)
          visibleRangeDebounceRef.current = null
        }
        fire()
        return
      }
      if (visibleRangeDebounceRef.current) clearTimeout(visibleRangeDebounceRef.current)
      visibleRangeDebounceRef.current = setTimeout(fire, VISIBLE_RANGE_DEBOUNCE_MS)
    },
    [
      onVisibleRangeChange,
      dates,
      isWeekView,
      isDayViewMultiDay,
      COL_W_WEEK,
      DAY_WIDTH,
      prefetchThreshold,
    ]
  )

  const onWeekScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      if (!isWeekView) return
      const el = e.currentTarget
      const maxScrollLeft = el.scrollWidth - el.clientWidth
      const threshold = COL_W_WEEK * (isDayViewNav ? 1.5 : 3)

      let didEdgeLoad = false
      // Edge: load prev/next week when scrolling near the ends (only if there's room to scroll)
      if (setDate && maxScrollLeft > threshold * 2) {
        if (el.scrollLeft < threshold) {
          didEdgeLoad = true
          scrollTriggeredUpdateRef.current = true
          setDate((d) => {
            const nd = new Date(d)
            nd.setDate(nd.getDate() - scrollNavDelta)
            return nd
          })
        } else if (el.scrollLeft > maxScrollLeft - threshold) {
          didEdgeLoad = true
          scrollTriggeredUpdateRef.current = true
          setDate((d) => {
            const nd = new Date(d)
            nd.setDate(nd.getDate() + scrollNavDelta)
            return nd
          })
        }
      }

      // Center: report visible week for header only (no setDate — buffer stays put, no scroll reset)
      if (!didEdgeLoad && onVisibleCenterChange) {
        const centerX = el.scrollLeft + el.clientWidth / 2
        const centerDayIdx = clamp(Math.floor(centerX / COL_W_WEEK), 0, dates.length - 1)
        if (centerDayIdx !== lastReportedDayIdxRef.current && dates[centerDayIdx]) {
          lastReportedDayIdxRef.current = centerDayIdx
          onVisibleCenterChange(new Date(dates[centerDayIdx]))
        }
      }

      if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft
      if (sidebarRef.current) sidebarRef.current.scrollTop = el.scrollTop
      reportVisibleRange(el)
    },
    [isWeekView, setDate, onVisibleCenterChange, COL_W_WEEK, isDayViewNav, scrollNavDelta, reportVisibleRange, dates]
  )

  const onDayScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      if (isWeekView) return
      const el = e.currentTarget
      if (sidebarRef.current) sidebarRef.current.scrollTop = el.scrollTop
      if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft
      if (isDayViewMultiDay && setDate) {
        const sl = el.scrollLeft
        const vw = el.clientWidth
        const maxScrollLeft = el.scrollWidth - vw
        const centerX = sl + vw / 2
        const dayIdx = clamp(Math.floor(centerX / DAY_WIDTH), 0, dates.length - 1)
        
        if (dayIdx !== lastReportedDayIdxRef.current && dates[dayIdx]) {
          lastReportedDayIdxRef.current = dayIdx
          scrollTriggeredUpdateRef.current = true
          const newDate = new Date(dates[dayIdx])
          setDate(newDate)
        }
        
        const halfWindow = Math.floor(dates.length / 2)
        if (maxScrollLeft > DAY_WIDTH * 2) {
          if (sl < DAY_WIDTH) {
            scrollTriggeredUpdateRef.current = true
            setDate((d) => {
              const nd = new Date(d)
              nd.setDate(nd.getDate() - halfWindow)
              return nd
            })
            lastReportedDayIdxRef.current = halfWindow
          } else if (sl > maxScrollLeft - DAY_WIDTH) {
            scrollTriggeredUpdateRef.current = true
            setDate((d) => {
              const nd = new Date(d)
              nd.setDate(nd.getDate() + halfWindow)
              return nd
            })
            lastReportedDayIdxRef.current = halfWindow
          }
        }
      } else if (hasDayScrollNav && setDate) {
        const sl = el.scrollLeft
        if (sl < DAY_SCROLL_BUFFER / 2) {
          setDate((d) => {
            const nd = new Date(d)
            nd.setDate(nd.getDate() - 1)
            return nd
          })
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollLeft = DAY_SCROLL_BUFFER
            if (headerRef.current) headerRef.current.scrollLeft = DAY_SCROLL_BUFFER
          })
        } else if (sl > DAY_SCROLL_BUFFER + DAY_WIDTH - DAY_SCROLL_BUFFER / 2) {
          setDate((d) => {
            const nd = new Date(d)
            nd.setDate(nd.getDate() + 1)
            return nd
          })
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollLeft = DAY_SCROLL_BUFFER
            if (headerRef.current) headerRef.current.scrollLeft = DAY_SCROLL_BUFFER
          })
        }
      }
      reportVisibleRange(el)
    },
    [isWeekView, isDayViewMultiDay, hasDayScrollNav, setDate, DAY_WIDTH, TOTAL_W, dates, reportVisibleRange]
  )

  /** P12-13/14: Skeleton blocks for loading state (same packing layout). */
  const skeletonBlocks = useMemo((): Block[] => {
    if (!isLoading) return []
    const out: Block[] = []
    CATEGORIES.forEach((cat) => {
      dates.forEach((date, di) => {
        out.push(
          {
            id: `skel-${cat.id}-${di}-0`,
            categoryId: cat.id,
            employeeId: "skeleton",
            date: toDateISO(date),
            startH: 9,
            endH: 13,
            employee: "",
            status: "published",
          },
          {
            id: `skel-${cat.id}-${di}-1`,
            categoryId: cat.id,
            employeeId: "skeleton",
            date: toDateISO(date),
            startH: 14,
            endH: 18,
            employee: "",
            status: "published",
          }
        )
      })
    })
    return out
  }, [isLoading, CATEGORIES, dates])

  const displayShifts = useMemo(
    () => (isLoading ? skeletonBlocks : shifts.filter((s) => selEmps.has(s.employeeId))),
    [isLoading, skeletonBlocks, shifts, selEmps]
  )

  const shiftIndex = useMemo((): Map<string, Block[]> => {
    const idx = new Map<string, Block[]>()
    for (const s of displayShifts) {
      const key = `${s.categoryId}:${s.date}`
      const list = idx.get(key)
      if (list) list.push(s)
      else idx.set(key, [s])
    }
    return idx
  }, [displayShifts])

  /** Sidebar-sorted categories — pre-computes aggregates to avoid O(n²) filter inside comparator */
  const SORTED_CATEGORIES = useMemo(() => {
    if (!sortBy) return CATEGORIES
    if (sortBy === "name") {
      return [...CATEGORIES].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name)
        return sortDir === "asc" ? cmp : -cmp
      })
    }
    // Pre-compute per-category value once — O(n) scan instead of O(n log n) × O(n) filter
    const catMap = new Map<string, number>()
    for (const s of shifts) {
      const prev = catMap.get(s.categoryId) ?? 0
      catMap.set(s.categoryId, prev + (sortBy === "hours" ? (s.endH - s.startH) : 1))
    }
    return [...CATEGORIES].sort((a, b) => {
      const av = catMap.get(a.id) ?? 0
      const bv = catMap.get(b.id) ?? 0
      return sortDir === "asc" ? av - bv : bv - av
    })
  }, [CATEGORIES, sortBy, sortDir, shifts])

  /**
   * Phase 4 — flat row list for the virtualizer.
   * In "individual" mode: category header + one row per employee.
   * In "category" mode: category header rows only (shifts stack inside like the original model).
   */
  const rowMode = settings.rowMode ?? "category"
  const flatRows = useFlatRows(SORTED_CATEGORIES, ALL_EMPLOYEES, collapsed, rowMode)

  // Pre-compute max packed tracks per category across all dates — O(dates × categories × shifts)
  // Separated so virtualizer estimateSize can use it without re-running flatRows loop
  const maxTracksPerCat = useMemo((): Map<string, number> => {
    const map = new Map<string, number>()
    for (const [key, dayShifts] of shiftIndex.entries()) {
      const catId = key.split(":")[0]
      if (!catId) continue
      const h = getCategoryRowHeight(catId, dayShifts)
      const prev = map.get(catId) ?? 0
      if (h > prev) map.set(catId, h)
    }
    return map
  }, [shiftIndex])

  const categoryHeights = useMemo((): Record<string, number> => {
    const result: Record<string, number> = {}
    flatRows.forEach((row) => {
      const key = row.kind === "employee" && row.employee
        ? `emp:${row.employee.id}`
        : `cat:${row.category.id}`
      if (row.kind === "category") {
        if (rowMode === "category" && !collapsed.has(row.category.id)) {
          // Use pre-computed max height — no inner dates.forEach loop
          result[key] = Math.max(maxTracksPerCat.get(row.category.id) ?? 0, ROLE_HDR + SHIFT_H)
        } else {
          result[key] = ROLE_HDR
        }
        return
      }
      // Individual mode: fixed 50px per employee row
      result[key] = 50
    })
    return result
  }, [maxTracksPerCat, flatRows, rowMode, collapsed])

  // NOTE: vrTopsRef is updated from virtualizer vr.start values every render
  const vrTopsRef = useRef<Record<string, number>>({})

  const categoryTops = useMemo((): Record<string, number> => {
    if (Object.keys(vrTopsRef.current).length === flatRows.length) {
      return { ...vrTopsRef.current }
    }
    const map: Record<string, number> = {}
    let acc = 0
    flatRows.forEach((row) => {
      const key = row.kind === "employee" && row.employee
        ? `emp:${row.employee.id}`
        : `cat:${row.category.id}`
      map[key] = acc
      acc += categoryHeights[key] ?? ROLE_HDR
    })
    return map
  }, [categoryHeights, flatRows])

  // For conflict detection: in day view with buffer, only the focused day counts (not all buffer days).
  const conflictRangeDates = useMemo((): Date[] => {
    if (isDayViewMultiDay && dates.length > 1 && focusedDate) {
      return [focusedDate]
    }
    if (isDayViewMultiDay && dates.length > 1) {
      const centerIdx = Math.floor(dates.length / 2)
      return dates[centerIdx] ? [dates[centerIdx]] : [dates[0]]
    }
    return dates
  }, [dates, isDayViewMultiDay, focusedDate])

  const visibleDateSet = useMemo(() => {
    const set = new Set<string>()
    conflictRangeDates.forEach((d) => set.add(toDateISO(d)))
    return set
  }, [conflictRangeDates])

  const visibleShifts = useMemo(
    () =>
      shifts.filter((s) =>
        visibleDateSet.has(typeof s.date === "string" ? s.date : toDateISO(s.date))
      ),
    [shifts, visibleDateSet]
  )

  const conflictIds = useMemo(() => findConflicts(visibleShifts), [visibleShifts])

  const orderedBlockIds = useMemo((): string[] => {
    const ids: string[] = []
    CATEGORIES.forEach((cat) => {
      dates.forEach((date) => {
        const dayShifts = shiftIndex.get(`${cat.id}:${toDateISO(date)}`) ?? []
        const sorted = [...dayShifts].sort((a, b) => a.startH - b.startH)
        sorted.forEach((s) => ids.push(s.id))
      })
    })
    return ids
  }, [shiftIndex, dates, CATEGORIES])

  const categoryHasShifts = useMemo((): Record<string, boolean> => {
    const map: Record<string, boolean> = {}
    for (const [key, list] of shiftIndex.entries()) {
      if (list.length > 0) {
        const catId = key.split(":")[0]
        map[catId] = true
      }
    }
    return map
  }, [shiftIndex])

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      const row = flatRows[i]
      if (!row) return ROLE_HDR
      const key = row.kind === "employee" && row.employee
        ? `emp:${row.employee.id}`
        : `cat:${row.category.id}`
      return categoryHeights[key] ?? ROLE_HDR
    },
    overscan: 6,
  })

  // Force virtualizer to re-measure whenever row heights change.
  // This is necessary because @tanstack/react-virtual caches estimateSize results
  // and won't pick up changes to categoryHeights (e.g. new shift added, collapse toggled)
  // without an explicit measure() call.
  const categoryHeightsRef = useRef(categoryHeights)
  useEffect(() => {
    if (categoryHeightsRef.current !== categoryHeights) {
      categoryHeightsRef.current = categoryHeights
      rowVirtualizer.measure()
    }
  })

  const totalHVirtual = rowVirtualizer.getTotalSize()

  const ds = useRef<DragState | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  /** Floating label that appears near the resize handle showing live time */
  const resizeLabelRef = useRef<HTMLDivElement | null>(null)
  /** Edge-scroll RAF: direction (-1 left, 0 none, 1 right) + speed multiplier */
  const edgeScrollRef = useRef<{ dirX: number; speedX: number; dirY: number; speedY: number } | null>(null)
  const edgeRafRef = useRef<number | null>(null)
  const layoutRef = useRef({
    categoryTops: {} as Record<string, number>,
    categoryHeights: {} as Record<string, number>,
    dates: [] as Date[],
    shifts: [] as Block[],
    CATEGORIES: [] as Resource[],
    collapsed: new Set<string>(),
  })
  layoutRef.current = {
    categoryTops,
    categoryHeights,
    dates,
    shifts,
    CATEGORIES,
    collapsed,
  }
  const [dragId, setDragId] = useState<string | null>(null)
  const gridPointerIdsRef = useRef<Set<number>>(new Set())
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null)
  const longPressPointerIdRef = useRef<number | null>(null)
  /** Long press on a specific block — for touch drag activation */
  const blockLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blockLongPressIdRef = useRef<string | null>(null)
  /** Block that is "activating" on long press (shows scale-up feedback) */
  const [activatingBlockId, setActivatingBlockId] = useState<string | null>(null)
  const pinchPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const initialPinchDistRef = useRef<number | null>(null)
  const initialZoomRef = useRef<number>(1)

  const getGridXY = useCallback((cx: number, cy: number): { x: number; y: number } => {
    const sr = scrollRef.current?.getBoundingClientRect()
    if (!sr) return { x: 0, y: 0 }
    const scrollLeft = scrollRef.current?.scrollLeft ?? 0
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    // Grid is inside scroll container: contentX = scrollLeft + (clientX - visibleLeft)
    // When hasDayScrollNav, grid starts after buffer; otherwise at 0
    const contentX = scrollLeft + (cx - sr.left)
    const contentY = scrollTop + (cy - sr.top)
    const gridX = hasDayScrollNav ? contentX - DAY_SCROLL_BUFFER : contentX
    return { x: gridX, y: contentY }
  }, [hasDayScrollNav])

  const getCategoryAtY = useCallback(
    (y: number): Resource => {
      if (y < 0) return CATEGORIES[0]!
      // Find the flat row whose top ≤ y < top + height
      for (const row of flatRows) {
        const key = row.kind === "employee" && row.employee
          ? `emp:${row.employee.id}`
          : `cat:${row.category.id}`
        const top = categoryTops[key] ?? 0
        const h   = categoryHeights[key] ?? 0
        if (y >= top && y < top + h) return row.category
      }
      return CATEGORIES[CATEGORIES.length - 1]!
    },
    [categoryTops, categoryHeights, flatRows, CATEGORIES]
  )

  const getHourAtX = useCallback(
    (x: number, di: number = 0): number => {
      if (isWeekView) {
        const localX = x - di * COL_W_WEEK
        return snapH(clamp(settings.visibleFrom + localX / PX_WEEK, 0, 24))
      }
      if (isDayViewMultiDay) {
        const localX = x - di * DAY_WIDTH
        return snapH(
          clamp(settings.visibleFrom + localX / HOUR_W, settings.visibleFrom, settings.visibleTo)
        )
      }
      return snapH(
        clamp(settings.visibleFrom + x / HOUR_W, settings.visibleFrom, settings.visibleTo)
      )
    },
    [isWeekView, isDayViewMultiDay, COL_W_WEEK, DAY_WIDTH, PX_WEEK, HOUR_W, settings.visibleFrom, settings.visibleTo]
  )

  const getDateIdx = useCallback(
    (x: number): number => {
      if (isDayViewMultiDay) return clamp(Math.floor(x / DAY_WIDTH), 0, dates.length - 1)
      if (!isWeekView) return 0
      return clamp(Math.floor(x / COL_W_WEEK), 0, dates.length - 1)
    },
    [isWeekView, isDayViewMultiDay, COL_W_WEEK, DAY_WIDTH, dates.length]
  )

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    longPressStartRef.current = null
    longPressPointerIdRef.current = null
  }, [])

  const clearBlockLongPress = useCallback(() => {
    if (blockLongPressTimerRef.current) {
      clearTimeout(blockLongPressTimerRef.current)
      blockLongPressTimerRef.current = null
    }
    blockLongPressIdRef.current = null
    setActivatingBlockId(null)
  }, [])

  const cleanupPointer = useCallback((pointerId: number) => {
    gridPointerIdsRef.current.delete(pointerId)
    if (longPressPointerIdRef.current === pointerId) clearLongPress()
    pinchPointersRef.current.delete(pointerId)
    if (pinchPointersRef.current.size < 2) initialPinchDistRef.current = null
  }, [clearLongPress])

  const clearStaffDrag = useCallback(() => {
    staffDragRef.current = null
    setIsStaffDragging(false)
    setDragEmpId(null)
    setDropHover(null)
    if (ghostRef.current) ghostRef.current.style.display = "none"
          if (resizeLabelRef.current) resizeLabelRef.current.style.display = "none"  }, [])

  const commitStaffDropAtClientXY = useCallback(
    (clientX: number, clientY: number) => {
      const drag = staffDragRef.current
      if (!drag) return
      const { x, y } = getGridXY(clientX, clientY)
      const newCat = getCategoryAtY(y)
      const di = getDateIdx(x)
      const hour = getHourAtX(x, di)
      const date = dates[di] ?? dates[0]
      if (!date) return
      const startH = Math.floor(hour)
      const endH = Math.min(startH + 4, 23)
      const emp = ALL_EMPLOYEES.find((x) => x.id === drag.empId)
      const fromCategoryId = drag.fromCategoryId

      if (fromCategoryId !== newCat.id) {
        const fromCategory = CATEGORIES.find((c) => c.id === fromCategoryId)
        const toCategory = CATEGORIES.find((c) => c.id === newCat.id)
        setCategoryWarn({
          empName: emp?.name ?? drag.empName,
          fromCategory,
          toCategory,
          onConfirmAction: () =>
            setShifts((prev) => [
              ...prev,
              (() => {
                const created: Block = {
                  id: nextUid(),
                  categoryId: newCat.id,
                  employeeId: drag.empId,
                  date: toDateISO(date),
                  startH,
                  endH,
                  employee: emp?.name || drag.empName || "?",
                  status: "draft",
                }
                onBlockCreate?.(created)
                return created
              })(),
            ]),
        })
      } else {
        setShifts((prev) => [
          ...prev,
          (() => {
            const created: Block = {
              id: nextUid(),
              categoryId: newCat.id,
              employeeId: drag.empId,
              date: toDateISO(date),
              startH,
              endH,
              employee: emp?.name || drag.empName || "?",
              status: "draft",
            }
            onBlockCreate?.(created)
            return created
          })(),
        ])
      }
    },
    [getGridXY, getCategoryAtY, getDateIdx, getHourAtX, dates, ALL_EMPLOYEES, CATEGORIES, nextUid, setShifts, onBlockCreate]
  )

  const onStaffPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = staffDragRef.current
      if (!drag) return
      const { x, y } = getGridXY(e.clientX, e.clientY)
      const cat = getCategoryAtY(y)
      const di = getDateIdx(x)
      const hour = getHourAtX(x, di)
      setDropHover({ categoryId: cat.id, di, hour })

      const ghostEl = ghostRef.current
      if (!ghostEl) return
      ghostEl.style.display = "flex"
      ghostEl.style.left = "0"
      ghostEl.style.top = "0"
      ghostEl.style.width = `160px`
      ghostEl.style.height = `26px`
      ghostEl.style.borderRadius = "999px"
      ghostEl.style.transform = `translate(${x + 8}px, ${y + 8}px)`
      ghostEl.style.background = "hsl(var(--primary))"
      ghostEl.style.borderColor = "hsl(var(--primary))"
      const label = ghostEl.querySelector("[data-ghost-label]") as HTMLElement | null
      if (label) {
        label.textContent = drag.empName
        label.style.color = "hsl(var(--primary-foreground))"
        label.style.background = "transparent"
      }
    },
    [getGridXY, getCategoryAtY, getDateIdx, getHourAtX]
  )

  const onStaffPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!staffDragRef.current) return
      commitStaffDropAtClientXY(e.clientX, e.clientY)
      clearStaffDrag()
    },
    [commitStaffDropAtClientXY, clearStaffDrag]
  )

  const onStaffPointerCancel = useCallback(() => {
    if (!staffDragRef.current) return
    clearStaffDrag()
  }, [clearStaffDrag])

  useEffect(() => {
    if (!isStaffDragging) return
    document.addEventListener("pointermove", onStaffPointerMove, { capture: true })
    document.addEventListener("pointerup", onStaffPointerUp, { capture: true })
    document.addEventListener("pointercancel", onStaffPointerCancel, { capture: true })
    return () => {
      document.removeEventListener("pointermove", onStaffPointerMove, { capture: true })
      document.removeEventListener("pointerup", onStaffPointerUp, { capture: true })
      document.removeEventListener("pointercancel", onStaffPointerCancel, { capture: true })
    }
  }, [isStaffDragging, onStaffPointerMove, onStaffPointerUp, onStaffPointerCancel])

  const onBD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Block): void => {
      if (readOnly) return
      if (shift.draggable === false) return
      if ((e.target as HTMLElement).dataset.resize) return
      if (gridPointerIdsRef.current.size >= 2) return
      // Multi-select: shift+click selects without dragging
      if (e.shiftKey) {
        toggleBlockSelect(shift.id, true)
        return
      }

      const isTouch = e.pointerType === "touch"
      const blockEl = e.currentTarget as HTMLElement
      const cat = CATEGORIES.find((c) => c.id === shift.categoryId)
      const color = cat ? getColor(cat.colorIdx).bg : "hsl(var(--primary))"

      const startDrag = (captureEvent: React.PointerEvent<HTMLDivElement> | PointerEvent): void => {
        const el = blockEl
        el.setPointerCapture(
          "pointerId" in captureEvent ? captureEvent.pointerId : e.pointerId
        )
        const { x, y } = getGridXY(e.clientX, e.clientY)
        // Capture grab offset + grid rect ONCE here — avoids getBoundingClientRect on every pointermove
        const blockRect = blockEl ? blockEl.getBoundingClientRect() : null
        const gRect = scrollRef.current?.getBoundingClientRect() ?? null
        const grabOffsetX = blockRect ? e.clientX - blockRect.left : 0
        const grabOffsetY = blockRect ? e.clientY - blockRect.top  : (SHIFT_H - 6) / 2
        ds.current = {
          type: "move",
          id: shift.id,
          sx: x, sy: y,
          startH: shift.startH,
          endH: shift.endH,
          categoryId: shift.categoryId,
          empId: shift.employeeId,
          dur: shift.endH - shift.startH,
          blockEl,
          blockColor: color,
          grabOffsetX,
          grabOffsetY,
          gridRect: gRect,
        }
        setDragId(shift.id)
        setActivatingBlockId(null)
        if (navigator.vibrate) navigator.vibrate(30)
      }

      if (!isTouch) {
        // Desktop: require ≥4px movement before committing to drag mode
        // This prevents accidental drags when the user just clicks a block
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        const downX = e.clientX
        const downY = e.clientY
        const DESKTOP_DRAG_THRESHOLD = 4

        const onMove = (mv: PointerEvent): void => {
          if (Math.hypot(mv.clientX - downX, mv.clientY - downY) >= DESKTOP_DRAG_THRESHOLD) {
            document.removeEventListener("pointermove", onMove, { capture: true })
            document.removeEventListener("pointerup", onUp, { capture: true })
            startDrag(e)
          }
        }
        const onUp = (): void => {
          document.removeEventListener("pointermove", onMove, { capture: true })
          document.removeEventListener("pointerup", onUp, { capture: true })
        }
        document.addEventListener("pointermove", onMove, { capture: true })
        document.addEventListener("pointerup", onUp, { capture: true })
        return
      }

      // Touch: start a long press timer — let scroll work until threshold
      e.stopPropagation()
      blockLongPressIdRef.current = shift.id
      const startX = e.clientX
      const startY = e.clientY

      // Show activating feedback at 200ms
      const activateTimer = setTimeout(() => setActivatingBlockId(shift.id), 200)

      blockLongPressTimerRef.current = setTimeout(() => {
        blockLongPressTimerRef.current = null
        clearTimeout(activateTimer)
        if (blockLongPressIdRef.current !== shift.id) return
        startDrag(e)
      }, LONG_PRESS_DELAY_MS)

      // Cancel long press if finger moves too much (user is scrolling)
      const onMove = (ev: PointerEvent): void => {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > LONG_PRESS_MOVE_THRESHOLD_PX) {
          clearTimeout(activateTimer)
          clearBlockLongPress()
          document.removeEventListener("pointermove", onMove, { capture: true })
          document.removeEventListener("pointerup", onUp, { capture: true })
        }
      }
      const onUp = (): void => {
        clearTimeout(activateTimer)
        clearBlockLongPress()
        document.removeEventListener("pointermove", onMove, { capture: true })
        document.removeEventListener("pointerup", onUp, { capture: true })
      }
      document.addEventListener("pointermove", onMove, { capture: true })
      document.addEventListener("pointerup", onUp, { capture: true })
    },
    [getGridXY, readOnly, toggleBlockSelect, CATEGORIES, getColor, clearBlockLongPress]
  )

  const onRRD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Block): void => {
      if (readOnly) return
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const { x } = getGridXY(e.clientX, e.clientY)
      ds.current = {
        type: "resize-right",
        id: shift.id,
        sx: x,
        sy: 0,
        startH: shift.startH,
        endH: shift.endH,
        categoryId: shift.categoryId,
        empId: shift.employeeId,
        dur: 0,
        blockEl: null,
        blockColor: "",
        grabOffsetX: 0,
        grabOffsetY: 0,
        gridRect: scrollRef.current?.getBoundingClientRect() ?? null,
      }
      setDragId(shift.id)
    },
    [getGridXY, readOnly]
  )

  const onRLD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Block): void => {
      if (readOnly) return
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const { x } = getGridXY(e.clientX, e.clientY)
      ds.current = {
        type: "resize-left",
        id: shift.id,
        sx: x,
        sy: 0,
        startH: shift.startH,
        endH: shift.endH,
        categoryId: shift.categoryId,
        empId: shift.employeeId,
        dur: 0,
        blockEl: null,
        blockColor: "",
        grabOffsetX: 0,
        grabOffsetY: 0,
        gridRect: scrollRef.current?.getBoundingClientRect() ?? null,
      }
      setDragId(shift.id)
    },
    [getGridXY, readOnly]
  )


  const onBlockKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, shift: Block, category: Resource): void => {
      if (e.key === "Tab") {
        const idx = orderedBlockIds.indexOf(shift.id)
        if (idx < 0) return
        const nextIdx = e.shiftKey ? idx - 1 : idx + 1
        const nextId = orderedBlockIds[nextIdx]
        if (nextId) {
          e.preventDefault()
          blockRefsRef.current[nextId]?.focus()
        }
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (!readOnly) onShiftClick(shift, category)
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (readOnly) return
        e.preventDefault()
        if (onDeleteShift) setShiftToDeleteConfirm(shift)
        return
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (readOnly) return
        e.preventDefault()
        const dir = e.key === "ArrowRight" ? 1 : -1
        const newStart = snapLocal(clamp(shift.startH + dir * snapHours, 0, 24 - (shift.endH - shift.startH)))
        const dur = shift.endH - shift.startH
        const newEnd = snapLocal(clamp(newStart + dur, 0, 24))
        setShifts((prev) =>
          prev.map((s) =>
            s.id === shift.id ? { ...s, startH: newStart, endH: newEnd } : s
          )
        )
        onBlockMoved?.(shift, shift.date, newStart, newEnd)
        onBlockMove?.({ ...shift, startH: newStart, endH: newEnd })
        return
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (readOnly) return
        e.preventDefault()
        const catIdx = CATEGORIES.findIndex((c) => c.id === shift.categoryId)
        if (catIdx < 0) return
        const nextIdx = e.key === "ArrowUp" ? catIdx - 1 : catIdx + 1
        const nextCat = categories[nextIdx]
        if (!nextCat) return
        setShifts((prev) =>
          prev.map((s) =>
            s.id === shift.id ? { ...s, categoryId: nextCat.id } : s
          )
        )
        onBlockMoved?.(shift, shift.date, shift.startH, shift.endH)
        onBlockMove?.({ ...shift, categoryId: nextCat.id })
        return
      }
    },
    [
      orderedBlockIds,
      onShiftClick,
      onDeleteShift,
      snapLocal,
      snapHours,
      setShifts,
      CATEGORIES,
      categories,
      onBlockMoved,
      readOnly,
      onBlockMove,
    ]
  )

  // ── Edge-scroll RAF loop ─────────────────────────────────────────────────
  // Runs independently of pointermove so scroll continues even if pointer stops moving.
  // Speed scales with proximity to edge: max 1.0 at the very edge, 0.0 at EDGE_SCROLL_ZONE.
  const EDGE_SCROLL_ZONE = 80
  const EDGE_SCROLL_MAX = 20   // px per frame at full speed

  const stopEdgeScroll = useCallback(() => {
    if (edgeRafRef.current !== null) {
      cancelAnimationFrame(edgeRafRef.current)
      edgeRafRef.current = null
    }
    edgeScrollRef.current = null
  }, [])

  const startEdgeScroll = useCallback((dirX: number, speedX: number, dirY: number, speedY: number) => {
    edgeScrollRef.current = { dirX, speedX, dirY, speedY }
    if (edgeRafRef.current !== null) return  // already running
    const tick = () => {
      const state = edgeScrollRef.current
      if (!state || !scrollRef.current || !ds.current) {
        stopEdgeScroll()
        return
      }
      if (state.dirX !== 0) {
        scrollRef.current.scrollLeft += state.dirX * state.speedX * EDGE_SCROLL_MAX
        if (headerRef.current) headerRef.current.scrollLeft = scrollRef.current.scrollLeft
      }
      if (state.dirY !== 0) {
        scrollRef.current.scrollTop += state.dirY * state.speedY * EDGE_SCROLL_MAX
      }
      edgeRafRef.current = requestAnimationFrame(tick)
    }
    edgeRafRef.current = requestAnimationFrame(tick)
  }, [stopEdgeScroll])

  const onPM = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (longPressPointerIdRef.current === e.pointerId && longPressStartRef.current) {
        const dx = e.clientX - longPressStartRef.current.x
        const dy = e.clientY - longPressStartRef.current.y
        if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD_PX) clearLongPress()
      }
      if (pinchPointersRef.current.has(e.pointerId)) {
        pinchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (pinchPointersRef.current.size === 2 && initialPinchDistRef.current !== null) {
          const [[, a], [, b]] = Array.from(pinchPointersRef.current)
          const dist = Math.hypot(b.x - a.x, b.y - a.y)
          if (dist > 0) {
            const scale = dist / initialPinchDistRef.current
            const newZoom = clamp(
              initialZoomRef.current * scale,
              ZOOM_LEVELS[0],
              ZOOM_LEVELS[ZOOM_LEVELS.length - 1]
            )
            const nearest = ZOOM_LEVELS.reduce((prev, curr) =>
              Math.abs(curr - newZoom) < Math.abs(prev - newZoom) ? curr : prev
            )
            if (setZoom) setZoom(nearest)
            else onPinchZoom?.(nearest)
          }
        }
      }
      if (!ds.current) return
      const d = ds.current
      const { x, y } = getGridXY(e.clientX, e.clientY)
      const newCat = getCategoryAtY(y)
      const di = getDateIdx(x)

      // Auto-scroll when dragging near edges — both horizontal (week/multiday) and vertical (all views)
      if (d.type === "move" && scrollRef.current) {
        const sr = d.gridRect
        if (sr) {
          const px = e.clientX - sr.left
          const py = e.clientY - sr.top
          const vw = sr.width
          const vh = sr.height
          let dirX = 0, speedX = 0, dirY = 0, speedY = 0
          // Horizontal — only in week/multiday where days scroll sideways
          if (isWeekView || isDayViewMultiDay) {
            if (px < EDGE_SCROLL_ZONE && px >= 0) {
              dirX = -1; speedX = Math.max(0.1, 1 - px / EDGE_SCROLL_ZONE)
            } else if (px > vw - EDGE_SCROLL_ZONE && px <= vw) {
              dirX = 1; speedX = Math.max(0.1, 1 - (vw - px) / EDGE_SCROLL_ZONE)
            }
          }
          // Vertical — all views (reach rows that are off-screen above/below)
          if (py < EDGE_SCROLL_ZONE && py >= 0) {
            dirY = -1; speedY = Math.max(0.1, 1 - py / EDGE_SCROLL_ZONE)
          } else if (py > vh - EDGE_SCROLL_ZONE && py <= vh) {
            dirY = 1; speedY = Math.max(0.1, 1 - (vh - py) / EDGE_SCROLL_ZONE)
          }
          if (dirX !== 0 || dirY !== 0) {
            startEdgeScroll(dirX, speedX, dirY, speedY)
          } else {
            stopEdgeScroll()
          }
        }
      }

      let ns: number, ne: number, categoryId: string, dayDelta: number
      if (d.type === "move") {
        const dx = x - d.sx
        const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
        const di1 = getDateIdx(x)
        dayDelta = di1 - di0
        ns =
          dayDelta !== 0
            ? snapH(clamp(getHourAtX(x, di1), 0, 24 - d.dur))
            : (() => {
                const hourOffset = isWeekView ? snapH(dx / PX_WEEK) : snapH(dx / HOUR_W)
                return snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
              })()
        ne = ns + d.dur
        categoryId = newCat.id
      } else if (d.type === "resize-right") {
        const pxPerH = isWeekView ? PX_WEEK : isDayViewMultiDay ? HOUR_W : HOUR_W
        ne = snapH(clamp(d.endH + (x - d.sx) / pxPerH, d.startH + SNAP, 24))
        ns = d.startH
        categoryId = d.categoryId
        dayDelta = 0
      } else {
        const pxPerH = isWeekView ? PX_WEEK : isDayViewMultiDay ? HOUR_W : HOUR_W
        ns = snapH(clamp(d.startH + (x - d.sx) / pxPerH, 0, d.endH - SNAP))
        ne = d.endH
        categoryId = d.categoryId
        dayDelta = 0
      }

      const lay = layoutRef.current
      const orig = lay.shifts.find((s) => s.id === d.id)
      const cat = lay.CATEGORIES.find((c) => c.id === categoryId)
      const ghostEl = ghostRef.current
      // Update hovered row highlight
      setHoveredCategoryId(cat?.id ?? null)
      if (!orig || !cat || lay.collapsed.has(cat.id) || !ghostEl) {
        if (ghostEl) ghostEl.style.display = "none"
        return
      }

      // Use employee-row top if we know the employee, else category header top
      const origShift = lay.shifts.find((s) => s.id === d.id)
      const empKey = origShift ? `emp:${origShift.employeeId}` : null
      const top = (empKey ? lay.categoryTops[empKey] : null)
        ?? lay.categoryTops[`cat:${cat.id}`]
        ?? lay.categoryTops[cat.id]
        ?? 0
      const rowH = (empKey ? lay.categoryHeights[empKey] : null)
        ?? lay.categoryHeights[`cat:${cat.id}`]
        ?? lay.categoryHeights[cat.id]
        ?? 40
      let left: number, width: number
      if (isWeekView) {
        const origDi = lay.dates.findIndex((dt) => sameDay(dt, orig.date))
        const newDi = clamp(origDi + dayDelta, 0, lay.dates.length - 1)
        left = newDi * COL_W_WEEK + (ns - settings.visibleFrom) * PX_WEEK
        width = Math.max((ne - ns) * PX_WEEK - 2, 8)
      } else if (isDayViewMultiDay) {
        const origDi = lay.dates.findIndex((dt) => sameDay(dt, orig.date))
        const newDi = clamp(origDi + dayDelta, 0, lay.dates.length - 1)
        const cs = Math.max(ns, settings.visibleFrom)
        const ce = Math.min(ne, settings.visibleTo)
        if (ce <= cs) {
          ghostEl.style.display = "none"
          return
        }
        left = newDi * DAY_WIDTH + (cs - settings.visibleFrom) * HOUR_W + 2
        width = Math.max((ce - cs) * HOUR_W - 4, 10)
      } else {
        const cs = Math.max(ns, settings.visibleFrom)
        const ce = Math.min(ne, settings.visibleTo)
        if (ce <= cs) {
          ghostEl.style.display = "none"
          return
        }
        left = (cs - settings.visibleFrom) * HOUR_W + 2
        width = Math.max((ce - cs) * HOUR_W - 4, 10)
      }
      const pixelTop = top + ROLE_HDR + 3
      const c = getColor(cat.colorIdx)

      // ── Snapped drop-zone ghost: real card appearance, no dashed border ──
      ghostEl.style.display = "flex"
      ghostEl.style.left = "0"
      ghostEl.style.top = "0"
      ghostEl.style.width = `${width}px`
      ghostEl.style.height = `${SHIFT_H - 6}px`
      ghostEl.style.transform = `translate(${left}px, ${pixelTop}px)`
      ghostEl.style.background = `${c.bg}22`
      ghostEl.style.border = `2px solid ${c.bg}88`
      ghostEl.style.borderRadius = "6px"
      ghostEl.style.boxShadow = `inset 0 0 0 1px ${c.bg}44`
      const label = ghostEl.querySelector("[data-ghost-label]") as HTMLElement | null
      if (label) {
        label.textContent = `${fmt12(ns)}–${fmt12(ne)}`
        label.style.color = c.bg
        label.style.background = "transparent"
        label.style.fontWeight = "700"
      }

      // ── Floating resize label near cursor — shows live time next to handle ──
      const resizeLabelEl = resizeLabelRef.current
      if (resizeLabelEl && (d.type === "resize-right" || d.type === "resize-left")) {
        const sr = d.gridRect
        if (sr) {
          // Position near cursor, offset slightly so it doesn't cover the handle
          const labelX = (scrollRef.current?.scrollLeft ?? 0) + (e.clientX - sr.left) + (d.type === "resize-right" ? 12 : -72)
          const labelY = (scrollRef.current?.scrollTop ?? 0) + (e.clientY - sr.top) - 24
          resizeLabelEl.style.display = "flex"
          resizeLabelEl.style.transform = `translate(${labelX}px, ${labelY}px)`
          resizeLabelEl.textContent = d.type === "resize-right" ? `→ ${fmt12(ne)}` : `${fmt12(ns)} ←`
          resizeLabelEl.style.background = c.bg
        }
      }

      // ── Real block follows cursor — lifted card feel ─────────────────────────
      if (d.type === "move") {
        const sr = d.gridRect
        if (sr) {
          const cursorLeft = (scrollRef.current?.scrollLeft ?? 0) + (e.clientX - sr.left) - d.grabOffsetX
          const cursorTop  = (scrollRef.current?.scrollTop ?? 0) + (e.clientY - sr.top) - d.grabOffsetY
          const liftedEl = blockRefsRef.current[d.id]
          if (liftedEl) {
            liftedEl.style.transform = `translate(${cursorLeft}px, ${cursorTop}px)`
          }
        }
      }
    },
    [getGridXY, getCategoryAtY, getDateIdx, isWeekView, isDayViewMultiDay, COL_W_WEEK, DAY_WIDTH, PX_WEEK, HOUR_W, clearLongPress, setZoom, onPinchZoom, settings.visibleFrom, settings.visibleTo, getColor, setHoveredCategoryId]
  )

  const onPC = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      // Reset lifted block transform before nulling ds so we have the id
      if (ds.current?.type === "move") {
        const el = blockRefsRef.current[ds.current.id]
        if (el) el.style.transform = ""
      }
      ds.current = null
      setDragId(null)
      setHoveredCategoryId(null)
      clearBlockLongPress()
      stopEdgeScroll()
      if (ghostRef.current) ghostRef.current.style.display = "none"
          if (resizeLabelRef.current) resizeLabelRef.current.style.display = "none"    },
    [clearBlockLongPress, stopEdgeScroll]

  )

  const onPU = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!ds.current) return
      const d = ds.current
      const { x, y } = getGridXY(e.clientX, e.clientY)
      const newCat = getCategoryAtY(y)
      if (d.type === "move") {
        // Guard: if the drop target is a collapsed category, treat as a cancel — don't commit
        if (collapsed.has(newCat.id)) {
          const el = blockRefsRef.current[d.id]
          if (el) el.style.transform = ""
          ds.current = null
          setDragId(null)
          setHoveredCategoryId(null)
          stopEdgeScroll()
          if (ghostRef.current) ghostRef.current.style.display = "none"
          if (resizeLabelRef.current) resizeLabelRef.current.style.display = "none"
          return
        }
        const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
        const di1 = getDateIdx(x)
        const dayDelta = di1 - di0
        const ns =
          dayDelta !== 0
            ? snapLocal(clamp(getHourAtX(x, di1), 0, 24 - d.dur))
            : snapLocal(
                clamp(
                  d.startH + (isWeekView ? snapLocal((x - d.sx) / PX_WEEK) : snapLocal((x - d.sx) / HOUR_W)),
                  0,
                  24 - d.dur
                )
              )
        const origShift = shifts.find((x) => x.id === d.id)
        const newDateIdx = origShift
          ? clamp(dates.findIndex((dt) => sameDay(dt, origShift.date)) + dayDelta, 0, dates.length - 1)
          : 0
        const newDate = isWeekView || isDayViewMultiDay
          ? toDateISO(dates[newDateIdx])
          : (() => {
              // Single-day view: dragging past the right edge → next day, past left edge → prev day
              if (!origShift) return ""
              const origD = new Date(origShift.date + "T12:00:00")
              if (x > DAY_WIDTH) {
                origD.setDate(origD.getDate() + 1)
              } else if (x < 0) {
                origD.setDate(origD.getDate() - 1)
              }
              return toDateISO(origD)
            })()
        if (origShift && wouldConflictAt(shifts, d.id, { date: newDate, categoryId: newCat.id, startH: ns, endH: ns + d.dur })) {
          setDropConflictId(d.id)
          setTimeout(() => setDropConflictId(null), 800)
          const conflictEl = blockRefsRef.current[d.id]
          if (conflictEl) conflictEl.style.transform = ""
          ds.current = null
          setDragId(null)
          setHoveredCategoryId(null)
          stopEdgeScroll()
          if (ghostRef.current) ghostRef.current.style.display = "none"
          if (resizeLabelRef.current) resizeLabelRef.current.style.display = "none"
          return
        }
      }
      // Normal successful drop — reset transform before React re-renders position
      const droppedEl = blockRefsRef.current[d.id]
      if (droppedEl) droppedEl.style.transform = ""
      ds.current = null
      setDragId(null)
      setHoveredCategoryId(null)
      stopEdgeScroll()
      if (ghostRef.current) ghostRef.current.style.display = "none"
          if (resizeLabelRef.current) resizeLabelRef.current.style.display = "none"
      setShifts((prev) => {
        const next = prev.map((s) => {
          if (s.id !== d.id) return s
          const origEmp = ALL_EMPLOYEES.find((emp) => emp.id === s.employeeId)

          if (d.type === "move") {
            const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
            const di1 = getDateIdx(x)
            const dayDelta = di1 - di0
            const ns =
              dayDelta !== 0
                ? snapLocal(clamp(getHourAtX(x, di1), 0, 24 - d.dur))
                : snapLocal(
                    clamp(
                      d.startH + (isWeekView ? snapLocal((x - d.sx) / PX_WEEK) : snapLocal((x - d.sx) / HOUR_W)),
                      0,
                      24 - d.dur
                    )
                  )
            const origDateIdx = dates.findIndex((dt) => sameDay(dt, s.date))
            const newDateIdx = clamp(origDateIdx + dayDelta, 0, dates.length - 1)
            const newDate =
              isWeekView || isDayViewMultiDay ? toDateISO(dates[newDateIdx]) : s.date

            if (newCat.id !== s.categoryId && origEmp && origEmp.categoryId !== newCat.id) {
              setCategoryWarn({ shift: s, newCategoryId: newCat.id, ns, ne: ns + d.dur, newDate })
              return s
            }
            const updated = { ...s, startH: ns, endH: ns + d.dur, categoryId: newCat.id, date: newDate }
            onBlockMove?.(updated)
            return updated
          } else if (d.type === "resize-right") {
            const ne = snapLocal(
              clamp(d.endH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), d.startH + snapHours, 24)
            )
            const updated = { ...s, endH: ne }
            onBlockResize?.(updated)
            return updated
          } else {
            const ns = snapLocal(
              clamp(d.startH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), 0, d.endH - snapHours)
            )
            const updated = { ...s, startH: ns }
            onBlockResize?.(updated)
            return updated
          }
        })
        if (d.type === "move") {
          const updated = next.find((x) => x.id === d.id)
          if (updated) onBlockMoved?.(updated, updated.date, updated.startH, updated.endH)
        }
        return next
      })
    },
    [
      getGridXY,
      getCategoryAtY,
      getDateIdx,
      isWeekView,
      isDayViewMultiDay,
      COL_W_WEEK,
      DAY_WIDTH,
      PX_WEEK,
      HOUR_W,
      dates,
      shifts,
      setShifts,
      ALL_EMPLOYEES,
      snapLocal,
      snapHours,
      onBlockMoved,
      onBlockMove,
      onBlockResize,
      getHourAtX,
      collapsed,
      stopEdgeScroll,
    ]
  )

  const onGridPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      gridPointerIdsRef.current.add(e.pointerId)
      const target = e.target as HTMLElement
      if (target.closest("[data-empty-cell]")) {
        swipeStartRef.current = { x: e.clientX, y: e.clientY }
        longPressStartRef.current = { x: e.clientX, y: e.clientY }
        longPressPointerIdRef.current = e.pointerId
        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null
          const start = longPressStartRef.current
          longPressStartRef.current = null
          longPressPointerIdRef.current = null
          if (!start || !gridRef.current) return
          const { x: gx, y: gy } = getGridXY(start.x, start.y)
          const cat = getCategoryAtY(gy)
          const di = getDateIdx(gx)
          const hour = getHourAtX(gx, di)
          const date = dates[di]
          if (date) setAddPrompt({ date, categoryId: cat.id, hour })
        }, LONG_PRESS_DELAY_MS)
      }
      pinchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pinchPointersRef.current.size === 2) {
        const [[, a], [, b]] = Array.from(pinchPointersRef.current)
        initialPinchDistRef.current = Math.hypot(b.x - a.x, b.y - a.y)
        initialZoomRef.current = zoom
      }
    },
    [getGridXY, getCategoryAtY, getHourAtX, getDateIdx, dates, zoom]
  )

  const onGridPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      cleanupPointer(e.pointerId)
      if (!ds.current && swipeStartRef.current && onSwipeNavigate) {
        const dx = e.clientX - swipeStartRef.current.x
        const dy = e.clientY - swipeStartRef.current.y
        if (Math.abs(dx) > SWIPE_MIN_DELTA_X_PX && Math.abs(dy) < SWIPE_MAX_DELTA_Y_PX) {
          onSwipeNavigate(dx > 0 ? -1 : 1)
        }
        swipeStartRef.current = null
      }
      onPURef.current(e as unknown as React.PointerEvent<HTMLDivElement>)
    },
    [cleanupPointer, onSwipeNavigate]
  )

  const onGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const target = document.activeElement as HTMLElement | null
      if (target?.getAttribute?.("data-block-id")) return
      e.preventDefault()
      onNavigate?.(e.key === "ArrowRight" ? 1 : -1)
    },
    [onNavigate]
  )

  const cleanupPointerRef = useRef(cleanupPointer)
  cleanupPointerRef.current = cleanupPointer
  // Document-level listeners ensure we capture pointerup even when pointer leaves grid (enables drag-to-other-day)
  const onPMRef = useRef(onPM)
  const onPURef = useRef(onPU)
  const onPCRef = useRef(onPC)
  onPMRef.current = onPM
  onPURef.current = onPU
  onPCRef.current = onPC

  // Native passive scroll listener — zero-lag header sync (fires before paint, no React overhead)
  // The React onScroll prop fires after React's batching delay causing header to lag behind grid
  const onWeekScrollRef = useRef(onWeekScroll)
  const onDayScrollRef = useRef(onDayScroll)
  onWeekScrollRef.current = onWeekScroll
  onDayScrollRef.current = onDayScroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = (e: Event) => {
      // Immediately sync header — no React batching delay
      if (headerRef.current) headerRef.current.scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft
      if (sidebarRef.current) sidebarRef.current.scrollTop = (e.currentTarget as HTMLDivElement).scrollTop
    }
    el.addEventListener("scroll", handler, { passive: true })
    return () => el.removeEventListener("scroll", handler)
  }, [])  // empty deps — refs are stable
  useEffect(() => {
    if (!dragId) return
    const pm = (e: PointerEvent) => onPMRef.current(e as unknown as React.PointerEvent<HTMLDivElement>)
    const pu = (e: PointerEvent) => {
      cleanupPointerRef.current((e as PointerEvent).pointerId)
      onPURef.current(e as unknown as React.PointerEvent<HTMLDivElement>)
    }
    const pc = (e: PointerEvent) => {
      cleanupPointerRef.current((e as PointerEvent).pointerId)
      onPCRef.current(e as unknown as React.PointerEvent<HTMLDivElement>)
    }
    document.addEventListener("pointermove", pm, { capture: true })
    document.addEventListener("pointerup", pu, { capture: true })
    document.addEventListener("pointercancel", pc, { capture: true })
    return () => {
      document.removeEventListener("pointermove", pm, { capture: true })
      document.removeEventListener("pointerup", pu, { capture: true })
      document.removeEventListener("pointercancel", pc, { capture: true })
      stopEdgeScroll()
    }
  }, [dragId, stopEdgeScroll])

  const [nowH, setNowH] = useState(
    () => new Date().getHours() + new Date().getMinutes() / 60
  )
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      setNowH(d.getHours() + d.getMinutes() / 60)
    }, 60000)
    return () => clearInterval(t)
  }, [])

  const todayIdx = dates.findIndex((d) => isToday(d))
  const nowPositionPx =
    todayIdx >= 0 && nowH >= settings.visibleFrom && nowH < settings.visibleTo
      ? isWeekView
        ? todayIdx * COL_W_WEEK + (nowH - settings.visibleFrom) * PX_WEEK
        : isDayViewMultiDay
          ? todayIdx * DAY_WIDTH + (nowH - settings.visibleFrom) * HOUR_W
          : (nowH - settings.visibleFrom) * HOUR_W
      : 0
  const scrollToNow = useScrollToNow(scrollRef, nowPositionPx)
  useEffect(() => {
    if (scrollToNowRef) scrollToNowRef.current = scrollToNow
    return () => {
      if (scrollToNowRef) scrollToNowRef.current = null
    }
  }, [scrollToNow, scrollToNowRef])
  useEffect(() => {
    if (!initialScrollToNow || !scrollRef.current) return
    const t = requestAnimationFrame(() => {
      scrollToNow()
    })
    return () => cancelAnimationFrame(t)
  }, [initialScrollToNow])

  const currentCategory = isMobileSingleResource && categories[mobileResourceIndex!]
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {isMobileSingleResource && currentCategory && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
            background: "var(--muted)",
          }}
        >
          <button
            type="button"
            onClick={() => onMobileResourceChange?.(-1)}
            disabled={mobileResourceIndex! <= 0}
            aria-label="Previous resource"
            style={{
              padding: "4px 8px",
              border: "none",
              background: "transparent",
              cursor: mobileResourceIndex! <= 0 ? "not-allowed" : "pointer",
              color: "var(--muted-foreground)",
              opacity: mobileResourceIndex! <= 0 ? 0.5 : 1,
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
            {currentCategory.name}
          </span>
          <button
            type="button"
            onClick={() => onMobileResourceChange?.(1)}
            disabled={mobileResourceIndex! >= categories.length - 1}
            aria-label="Next resource"
            style={{
              padding: "4px 8px",
              border: "none",
              background: "transparent",
              cursor: mobileResourceIndex! >= categories.length - 1 ? "not-allowed" : "pointer",
              color: "var(--muted-foreground)",
              opacity: mobileResourceIndex! >= categories.length - 1 ? 0.5 : 1,
            }}
          >
            →
          </button>
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          borderBottom: "2px solid var(--border)",
          background: "var(--muted)",
        }}
      >
        <div
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 0 0 0",
            overflow: "hidden",
          }}
        >
          {/* Column headers row */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px 4px", gap: 2 }}>
            {(["name", "hours", "scheduled"] as const).map((col) => {
              const colLabel = col === "name" ? labels.category ?? "Name" : col === "hours" ? "Hours" : "Shifts"
              const isActive = sortBy === col
              return (
                <button
                  key={col}
                  type="button"
                  title={`Sort by ${colLabel} (${isActive ? (sortDir === "asc" ? "low→high, click for high→low" : "high→low, click for low→high") : "click to sort"})`}
                  onClick={() => toggleSort(col)}
                  style={{
                    fontSize: 9,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    background: isActive ? "var(--accent)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: col === "name" ? 1 : 0,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    transition: "background 100ms, color 100ms",
                  }}
                >
                  {colLabel}
                  <span style={{ fontSize: 8, opacity: isActive ? 1 : 0.4 }}>
                    {isActive ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div ref={headerRef} style={{ flex: 1, overflowX: "hidden" }}>
          <div
            style={{
              display: "flex",
              width: isWeekView || isDayViewMultiDay ? TOTAL_W : hasDayScrollNav ? TOTAL_W : DAY_WIDTH,
              minWidth: isWeekView || isDayViewMultiDay ? TOTAL_W : hasDayScrollNav ? TOTAL_W : DAY_WIDTH,
            }}
          >
            {hasDayScrollNav && (
              <div style={{ width: DAY_SCROLL_BUFFER, flexShrink: 0, minWidth: DAY_SCROLL_BUFFER }} />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                flexShrink: 0,
              }}
            >
              {isWeekView && (
                <div style={{ display: "flex", width: TOTAL_W }}>
                  {dates.map((d, i) => {
                    const today = isToday(d)
                    const closed = settings.workingHours[d.getDay()] === null
                    return (
                      <div
                        key={i}
                        onDoubleClick={() => onDateDoubleClick?.(d)}
                        title={onDateDoubleClick ? "Double-click to open day view" : undefined}
                        style={{
                          width: COL_W_WEEK,
                          flexShrink: 0,
                          textAlign: "center",
                          padding: "8px 4px 6px",
                          borderLeft: i === 0 ? "1px solid var(--border)" : "2px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          background: today ? "var(--accent)" : closed ? "var(--muted)" : "var(--background)",
                          cursor: onDateDoubleClick ? "pointer" : "default",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: today ? "var(--primary)" : closed ? "var(--muted-foreground)" : "var(--muted-foreground)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {MONTHS_SHORT[d.getMonth()]} {DOW_MON_FIRST[(d.getDay() + 6) % 7]}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: today ? "var(--background)" : closed ? "var(--muted-foreground)" : "var(--foreground)/08",
                            background: today ? "var(--primary)" : "transparent",
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "2px auto 0",
                          }}
                        >
                          {d.getDate()}
                        </div>
                        {!closed && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: 4,
                              paddingLeft: 2,
                              paddingRight: 2,
                            }}
                          >
                            {Array.from(
                              {
                                length:
                                  Math.floor(
                                    (settings.visibleTo - settings.visibleFrom) /
                                      weekTimeLabelGap
                                  ) + 1,
                              },
                              (_, k) => {
                                const h = Math.min(
                                  settings.visibleFrom + k * weekTimeLabelGap,
                                  settings.visibleTo - 0.01
                                )
                                return (
                                  <span
                                    key={h}
                                    title={getTimeLabel(toDateISO(d), h)}
                                    style={{
                                      fontSize: 8,
                                      fontWeight: 600,
                                      color: "var(--muted-foreground)",
                                      flex: 1,
                                      textAlign: "center",
                                      minWidth: 0,
                                    }}
                                  >
                                    {getTimeLabel(toDateISO(d), h)}
                                  </span>
                                )
                              }
                            )}
                          </div>
                        )}
                        {closed && (
                          <div style={{ fontSize: 8, color: "var(--muted-foreground)", fontWeight: 600, marginTop: 1 }}>
                            CLOSED
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {isDayViewMultiDay && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: TOTAL_W,
                    background: "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: TOTAL_W,
                      padding: "4px 0 2px",
                    }}
                  >
                    {dates.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          width: DAY_WIDTH,
                          flexShrink: 0,
                          textAlign: "center",
                          borderLeft: i === 0 ? "1px solid var(--border)" : "2px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          padding: "0 4px",
                          background: "var(--background)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: isToday(d) ? "var(--primary)" : "var(--muted-foreground)",
                          }}
                        >
                          {MONTHS_SHORT[d.getMonth()]} {DOW_MON_FIRST[(d.getDay() + 6) % 7]} {d.getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: TOTAL_W,
                      minHeight: 32,
                    }}
                  >
                    {dates.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          width: DAY_WIDTH,
                          flexShrink: 0,
                          borderLeft: i === 0 ? "1px solid var(--border)" : "2px solid var(--border)",
                          borderRight: "1px solid var(--border)",
                          background: isToday(d) ? "var(--accent)" : "transparent",
                        }}
                      >
                        {DAY_VISIBLE_SLOTS.map((h) => {
                          const dashed = isOutsideWorkingHours(h, settings, d.getDay())
                          return (
                            <div
                              key={String(h)}
                              title={getTimeLabel(toDateISO(d), h)}
                              style={{
                                width: SLOT_W,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "flex-end",
                                padding: "0 0 4px 6px",
                                fontSize: dayTimeStep < 1 ? 9 : 10,
                                fontWeight: 600,
                                borderRight: "1px solid var(--border)",
                                background: dashed ? DASHED_BG : hourBg(h, settings, d.getDay()),
                                color: (dayTimeStep < 1 ? Math.abs(h - nowH) < 0.3 : h === Math.floor(nowH)) && isToday(d) ? "var(--primary)" : "var(--muted-foreground)",
                              }}
                            >
                              {getTimeLabel(toDateISO(d), h)}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!isWeekView && !isDayViewMultiDay && (
                <div
                  style={{
                    display: "flex",
                    width: DAY_WIDTH,
                    height: HOUR_HDR_H,
                    background: "var(--muted)",
                  }}
                >
                  {DAY_VISIBLE_SLOTS.map((h) => {
                    const dashed = isOutsideWorkingHours(h, settings, dates[0].getDay())
                    return (
                      <div
                        key={String(h)}
                        title={getTimeLabel(toDateISO(dates[0]), h)}
                        style={{
                          width: SLOT_W,
                          flexShrink: 0,
                          height: "100%",
                          display: "flex",
                          alignItems: "flex-end",
                          padding: "0 0 6px 8px",
                          fontSize: dayTimeStep < 1 ? 9 : 11,
                          fontWeight: 600,
                          borderRight: "1px solid var(--border)",
                          background: dashed ? DASHED_BG : hourBg(h, settings, dates[0].getDay()),
                          color: (dayTimeStep < 1 ? Math.abs(h - nowH) < 0.3 : h === Math.floor(nowH)) ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      >
                        {getTimeLabel(toDateISO(dates[0]), h)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {hasDayScrollNav && (
              <div style={{ width: DAY_SCROLL_BUFFER, flexShrink: 0, minWidth: DAY_SCROLL_BUFFER }} />
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div
          ref={sidebarRef}
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            overflowY: "hidden",
            background: "var(--muted)",
            position: "relative",
          }}
        >
          {(() => {
            const refDate = focusedDate ?? dates[0]
            let baseShifts: Block[]
            if (isWeekView) {
              const [weekStartOrig] = getWeekDates(refDate)
              const weekStart = new Date(weekStartOrig)
              weekStart.setHours(0, 0, 0, 0)
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekEnd.getDate() + 6)
              weekEnd.setHours(23, 59, 59, 999)
              const weekStartISO = toDateISO(weekStart)
              const weekEndISO = toDateISO(weekEnd)
              baseShifts = shifts.filter(
                (s) =>
                  selEmps.has(s.employeeId) &&
                  s.date >= weekStartISO &&
                  s.date <= weekEndISO
              )
            } else {
              baseShifts = shifts.filter(
                (s) => sameDay(s.date, refDate) && selEmps.has(s.employeeId)
              )
            }
            const isDev =
              typeof import.meta !== "undefined" &&
              (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true
            if (isDev) {
              const refLabel = refDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
            }
            return (
              <div style={{ position: "relative", height: totalHVirtual }}>
                {rowVirtualizer.getVirtualItems().map((vr) => {
                  const row = flatRows[vr.index]
                  if (!row) return null
                  const cat = row.category
                  const emp = row.employee
                  const c = getColor(cat.colorIdx)
                  const rowKey = row.key

                  // ── Category header row ──────────────────────────────────
                  if (row.kind === "category") {
                    const catShifts = baseShifts.filter((s) => s.categoryId === cat.id)
                    const scheduled = catShifts.length
                    const totalHours = catShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
                    return (
                      <div
                        key={rowKey}
                        style={{
                          position: "absolute",
                          top: vr.start,
                          left: 0,
                          right: 0,
                          height: vr.size,
                          borderBottom: `1px solid ${c.bg}30`,
                          background: hoveredCategoryId === cat.id
                            ? `${c.bg}18`
                            : `${c.bg}08`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          overflow: "hidden",
                          transition: "background 80ms ease",
                        }}
                      >
                        <div style={{ height: ROLE_HDR, display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
                          {slots.resourceHeader ? (
                            slots.resourceHeader({
                              resource: cat,
                              scheduledCount: scheduled,
                              isCollapsed: collapsed.has(cat.id),
                              onToggleCollapse: () => toggleCollapse(cat.id),
                            })
                          ) : (
                            <>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.bg, flexShrink: 0, marginTop: 2 }} />
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {cat.name}
                                </span>
                                {(totalHours > 0 || scheduled > 0) && (
                                  <span style={{ fontSize: 9, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {totalHours > 0 ? `${totalHours.toFixed(1)}h` : ""}
                                    {totalHours > 0 && scheduled > 0 ? " · " : ""}
                                    {scheduled > 0 ? `${scheduled} shift${scheduled !== 1 ? "s" : ""}` : ""}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleCollapse(cat.id)}
                                aria-label={collapsed.has(cat.id) ? "Expand" : "Collapse"}
                                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", transform: collapsed.has(cat.id) ? "rotate(-90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                              </button>
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setStaffPanel((p) => p?.categoryId === cat.id ? null : { categoryId: cat.id, anchorRect: rect })
                                }}
                                style={{ fontSize: 10, fontWeight: 600, color: c.text, background: c.light, border: `1px solid ${c.border}`, borderRadius: 5, padding: "2px 6px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                              >
                                {labels.staff}
                              </button>
                            </>
                          )}
                        </div>
                        {totalHours > 0 && (
                          <div style={{ padding: "0 10px 4px", flexShrink: 0 }}>
                            <div style={{ height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 2, background: c.bg, width: `${Math.min(100, (totalHours / 40) * 100)}%`, transition: "width 200ms ease" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // ── Employee row ──────────────────────────────────────────
                  const empShifts = baseShifts.filter((s) => s.categoryId === cat.id && s.employeeId === emp!.id)
                  const empHours = empShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
                  return (
                    <div
                      key={rowKey}
                      style={{
                        position: "absolute",
                        top: vr.start,
                        left: 0,
                        right: 0,
                        height: vr.size,
                        borderBottom: "1px solid var(--border)",
                        background: hoveredCategoryId === cat.id ? `${c.bg}0a` : "var(--muted)",
                        display: "flex",
                        alignItems: "flex-start",
                        paddingLeft: 18,
                        paddingTop: 4,
                        gap: 6,
                        overflow: "hidden",
                        transition: "background 80ms ease",
                      }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, fontWeight: 700, color: c.text }}>
                        {emp!.avatar ?? emp!.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {emp!.name}
                        </div>
                        {empHours > 0 && (
                          <div style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{empHours.toFixed(1)}h</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
          {/* Resize handle — subtle grip strip, primary on hover */}
          <div
            onPointerDown={onSidebarResizeStart}
            onPointerMove={onSidebarResizeMove}
            onPointerUp={onSidebarResizeEnd}
            onPointerCancel={onSidebarResizeEnd}
            style={{
              position: "absolute",
              top: 0,
              right: -3,
              width: 6,
              height: "100%",
              cursor: "col-resize",
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              transition: "background 120ms",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "var(--primary)"
              el.style.opacity = "0.35"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "transparent"
              el.style.opacity = "1"
            }}
          >
            {/* Grip dots — visible hint that this is draggable */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, pointerEvents: "none" }}>
              {[0,1,2,3,4].map((i) => (
                <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--border)" }} />
              ))}
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={isWeekView ? onWeekScroll : onDayScroll}
          style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
        >
          <div
            style={{
              display: "flex",
              width: isWeekView || isDayViewMultiDay ? TOTAL_W : hasDayScrollNav ? TOTAL_W : DAY_WIDTH,
              minWidth:
                isWeekView || isDayViewMultiDay ? TOTAL_W : hasDayScrollNav ? TOTAL_W : DAY_WIDTH,
            }}
          >
            {hasDayScrollNav && (
              <div style={{ width: DAY_SCROLL_BUFFER, flexShrink: 0, minWidth: DAY_SCROLL_BUFFER }} />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                flexShrink: 0,
              }}
            >
              <div
                ref={gridRef}
                className="transition-all duration-200"
                style={{
                  position: "relative",
                  width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                  height: totalHVirtual,
                  minHeight: "100%",
                  contain: "layout style",
                  willChange: dragId ? "contents" : "auto",
                }}
                tabIndex={0}
                onKeyDown={onGridKeyDown}
                onPointerDown={onGridPointerDown}
                onPointerMove={onPM}
                onPointerUp={onGridPointerUp}
                onPointerCancel={onPC}
              >
            {/* Drop-zone ghost: snapped, shows landing position — no dashed border */}
            <div
              ref={ghostRef}
              data-scheduler-ghost
              style={{
                display: "none",
                position: "absolute",
                pointerEvents: "none",
                zIndex: 18,
                borderRadius: 6,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                data-ghost-label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 3,
                }}
              />
            </div>

            {/* Resize label: floats near cursor during resize showing live time */}
            <div
              ref={resizeLabelRef}
              style={{
                display: "none",
                position: "absolute",
                left: 0,
                top: 0,
                zIndex: 200,
                pointerEvents: "none",
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                borderRadius: 5,
                padding: "2px 7px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                willChange: "transform",
              }}
            />

            {/* Row hover highlight during drag */}
            {dragId && hoveredCategoryId && (() => {
              const top = categoryTops[hoveredCategoryId] ?? 0
              const h = categoryHeights[hoveredCategoryId] ?? 0
              const hovCat = SORTED_CATEGORIES.find(c => c.id === hoveredCategoryId)
              if (!hovCat) return null
              const col = getColor(hovCat.colorIdx)
              return (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top,
                    width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                    height: h,
                    background: `${col.bg}12`,
                    borderTop: `2px solid ${col.bg}44`,
                    borderBottom: `2px solid ${col.bg}44`,
                    pointerEvents: "none",
                    zIndex: 6,
                  }}
                />
              )
            })()}
            {rowVirtualizer.getVirtualItems().map((vr) => {
              const row = flatRows[vr.index]
              if (!row) return null
              const cat = row.category
              // Keep vrTopsRef in sync with actual virtualizer positions
              const rowTopsKey = row.kind === "employee" && row.employee
                ? `emp:${row.employee.id}` : `cat:${cat.id}`
              vrTopsRef.current[rowTopsKey] = vr.start
              const top = vr.start
              const rowH = vr.size
              // Individual mode: category header rows — solid tinted background, no hour cells
              if (row.kind === "category" && rowMode === "individual") {
                const c = getColor(cat.colorIdx)
                return (
                  <div
                    key={row.key}
                    style={{
                      position: "absolute",
                      left: 0,
                      top,
                      width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                      height: rowH,
                      background: `${c.bg}08`,
                      borderBottom: `1px solid ${c.bg}30`,
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  />
                )
              }
              // Category mode category rows + all employee rows → render hour-slot cells
              return dates.map((date, di) => {
                const closed = settings.workingHours[date.getDay()] === null
                const today = isToday(date)
                if (isDayViewMultiDay) {
                  return DAY_VISIBLE_SLOTS.map((h) => {
                    const dashed = isOutsideWorkingHours(h, settings, date.getDay())
                    return (
                      <div
                        key={`bg-${row.key}-${di}-${h}`}
                        data-empty-cell
                        role="gridcell"
                        className="changeGrid-first"
                        style={{
                          position: "absolute",
                          left: di * DAY_WIDTH + (h - settings.visibleFrom) * HOUR_W,
                          top,
                          width: SLOT_W,
                          height: rowH,
                          background: dashed ? DASHED_BG : hourBg(h, settings, date.getDay()),
                          borderRight: "1px solid var(--sch-b-60)",
                        }}
                        onPointerEnter={() => {
                          if (!dragEmpId) return
                          setDropHover({ categoryId: cat.id, di, hour: h })
                        }}
                      />
                    )
                  })
                }
                if (isWeekView) {
                  return (
                    <div
                      key={`bg-${row.key}-${di}`}
                      data-empty-cell
                      role="gridcell"
                      className="changeGrid-second"
                      style={{
                        position: "absolute",
                        left: di * COL_W_WEEK,
                        top,
                        width: COL_W_WEEK,
                        height: rowH,
                        background: today ? "var(--accent)" : closed ? "var(--muted)" : "var(--background)",
                        borderRight: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onPointerEnter={() => {
                        if (!dragEmpId) return
                        setDropHover({ categoryId: cat.id, di })
                      }}
                    >
                      {Array.from(
                        { length: settings.visibleTo - settings.visibleFrom + 1 },
                        (_, k) => {
                          const h = settings.visibleFrom + k
                          const dashed = isOutsideWorkingHours(h, settings, date.getDay())
                          return (
                            <div
                              key={k}
                              style={{
                                position: "absolute",
                                left: k * PX_WEEK,
                                top: 0,
                                width: Math.max(PX_WEEK, 2),
                                height: "100%",
                                background: dashed ? DASHED_BG : "transparent",
                                borderRight: "1px solid var(--sch-b-60)",
                                pointerEvents: "none",
                              }}
                            />
                          )
                        }
                      )}
                    </div>
                  )
                }
                return DAY_VISIBLE_SLOTS.map((h) => {
                  const dashed = isOutsideWorkingHours(h, settings, date.getDay())
                  return (
                  <div
                    key={`bg-${row.key}-${h}`}
                    data-empty-cell
                    role="gridcell"
                    className="changeGrid-third"
                    style={{
                      position: "absolute",
                      left: (h - settings.visibleFrom) * HOUR_W,
                      top,
                      width: SLOT_W,
                      height: rowH,
                      background: dashed ? DASHED_BG : hourBg(h, settings, date.getDay()),
                      borderRight: "1px solid var(--sch-b-60)",
                    }}
                    onPointerEnter={() => {
                      if (!dragEmpId) return
                      setDropHover({ categoryId: cat.id, hour: h })
                    }}
                  />
                )})
              })
            })}

            {rowVirtualizer.getVirtualItems().map((vr) => {
              const row = flatRows[vr.index]
              if (!row) return null
              // Category mode: separator after each category row
              // Individual mode: separator after each employee row (not category headers)
              const drawSep = rowMode === "category"
                ? row.kind === "category" && !collapsed.has(row.category.id)
                : row.kind === "employee"
              if (!drawSep) return null
              return (
                <div
                  key={`sep-${row.key}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: vr.start + vr.size - 1,
                    width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                    height: 2,
                    background: "var(--sch-fg-12))",
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                />
              )
            })}

            {(!isWeekView || isDayViewMultiDay) &&
              (isDayViewMultiDay
                ? dates.flatMap((_, di) =>
                    DAY_VISIBLE_SLOTS.map((h) => (
                      <div
                        key={`vl-${di}-${h}`}
                        style={{
                          position: "absolute",
                          left: di * DAY_WIDTH + (h - settings.visibleFrom) * HOUR_W,
                          top: 0,
                          width: 1,
                          height: totalHVirtual,
                          background: "var(--sch-fg-12))",
                          zIndex: 1,
                          pointerEvents: "none",
                        }}
                      />
                    ))
                  )
                : DAY_VISIBLE_SLOTS.map((h) => (
                    <div
                      key={`vl-${h}`}
                      style={{
                        position: "absolute",
                        left: (h - settings.visibleFrom) * HOUR_W,
                        top: 0,
                        width: 1,
                        height: totalHVirtual,
                        background: "var(--sch-fg-12))",
                        zIndex: 1,
                        pointerEvents: "none",
                      }}
                    />
                  )))}

            {dates.map((d, di) =>
              isToday(d) &&
              nowH >= settings.visibleFrom &&
              nowH < settings.visibleTo ? (
                <div
                  key={`now-${di}`}
                  className="pointer-events-none absolute top-0 z-15 h-full w-0.5 bg-destructive/80 shadow-[0_0_6px_var(--destructive)/0.4]"
                  style={{
                    left: isWeekView
                      ? di * COL_W_WEEK + (nowH - settings.visibleFrom) * PX_WEEK
                      : isDayViewMultiDay
                        ? di * DAY_WIDTH + (nowH - settings.visibleFrom) * HOUR_W
                        : (nowH - settings.visibleFrom) * HOUR_W,
                    height: totalHVirtual,
                  }}
                >
                  <div className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full border border-border bg-destructive/90" />
                </div>
              ) : null
            )}

            {rowVirtualizer.getVirtualItems().map((vr) => {
              const row = flatRows[vr.index]
              if (!row) return null
              // Individual mode: skip category headers (no blocks, no add buttons)
              if (row.kind === "category" && rowMode === "individual") return null
              // Category mode: skip collapsed category rows
              if (row.kind === "category" && collapsed.has(row.category.id)) return null
              // Individual mode: skip collapsed employee rows
              if (row.kind === "employee" && collapsed.has(row.category.id)) return null
              const cat = row.category
              const emp = row.kind === "employee" ? row.employee! : null
              const top = vr.start
              const rowH = vr.size
              const addBtnTop = top + rowH - ADD_BTN_H + (ADD_BTN_H - 20) / 2
              if (isWeekView || isDayViewMultiDay) {
                const colW = isDayViewMultiDay ? DAY_WIDTH : COL_W_WEEK
                return dates.map((date, di) => (
                  <div key={`add-${row.key}-${di}`} style={{ position: "absolute", left: di * colW + colW / 2 - 10, top: addBtnTop, display: "flex", gap: 4, zIndex: 25 }}>
                    <button
                      onClick={() =>
                        setAddPrompt({ date, categoryId: cat.id, hour: settings.visibleFrom, employeeId: emp?.id })
                      }
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "1.5px dashed var(--muted-foreground)",
                        background: "var(--background)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--muted-foreground)",
                        padding: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                      title="Add Shift"
                    >
                      <Plus size={9} />
                    </button>
                    {copiedShift && (
                      <button
                        onClick={() => {
                          const newShift: Block = {
                            ...copiedShift,
                            id: nextUid(),
                            date: toDateISO(date),
                            categoryId: cat.id,
                            employeeId: emp?.id ?? copiedShift.employeeId,
                            employee: emp?.name ?? copiedShift.employee,
                          }
                          setShifts((prev) => [...prev, newShift])
                          setCopiedShift?.(null)
                        }}
                        style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px dashed var(--primary)", background: "var(--background)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                        title="Paste Shift"
                      >
                        <ClipboardPaste size={9} />
                      </button>
                    )}
                  </div>
                ))
              }
              return DAY_VISIBLE_SLOTS.map((h) => (
                <div key={`add-${row.key}-${h}`} style={{ position: "absolute", left: (h - settings.visibleFrom) * HOUR_W + SLOT_W / 2 - 9, top: addBtnTop, display: "flex", gap: 4, zIndex: 25 }}>
                  <button
                    onClick={() =>
                      setAddPrompt({ date: dates[1] ?? dates[0]!, categoryId: cat.id, hour: h, employeeId: emp?.id })
                    }
                    style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px dashed var(--muted-foreground)", background: "var(--background)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                    title="Add Shift"
                  >
                    <Plus size={8} />
                  </button>
                  {copiedShift && (
                    <button
                      onClick={() => {
                        const newShift: Block = {
                          ...copiedShift,
                          id: nextUid(),
                          date: toDateISO(dates[1] ?? dates[0]!),
                          categoryId: cat.id,
                          employeeId: emp?.id ?? copiedShift.employeeId,
                          employee: emp?.name ?? copiedShift.employee,
                          startH: h,
                          endH: h + (copiedShift.endH - copiedShift.startH),
                        }
                        setShifts((prev) => [...prev, newShift])
                        setCopiedShift?.(null)
                      }}
                      style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px dashed var(--primary)", background: "var(--background)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                      title="Paste Shift"
                    >
                      <ClipboardPaste size={8} />
                    </button>
                  )}
                </div>
              ))
            })}

            {dropHover &&
              dragEmpId &&
              (() => {
                const cat = CATEGORIES.find((c) => c.id === dropHover.categoryId)
                if (!cat || collapsed.has(cat.id)) return null
                const c = getColor(cat.colorIdx)
                // Use category header top + total height of all employee rows in this category
                const catHeaderTop = categoryTops[`cat:${cat.id}`] ?? 0
                const catEmps = ALL_EMPLOYEES.filter((e) => e.categoryId === cat.id)
                const empHeights = catEmps.reduce((sum, e) => sum + (categoryHeights[`emp:${e.id}`] ?? SHIFT_H), 0)
                const top = catHeaderTop
                const rowH = ROLE_HDR + empHeights
                const dropClass = "bg-primary/10 ring-1 ring-primary/30 rounded pointer-events-none z-10"
                if (isWeekView)
                  return (
                    <div
                      className={dropClass}
                      style={{
                        position: "absolute",
                        left: (dropHover.di ?? 0) * COL_W_WEEK,
                        top,
                        width: COL_W_WEEK,
                        height: rowH,
                      }}
                    />
                  )
                if (isDayViewMultiDay)
                  return (
                    <div
                      className={dropClass}
                      style={{
                        position: "absolute",
                        left:
                          (dropHover.di ?? 0) * DAY_WIDTH +
                          ((dropHover.hour ?? settings.visibleFrom) - settings.visibleFrom) * HOUR_W,
                        top,
                        width: HOUR_W * 2,
                        height: rowH,
                      }}
                    />
                  )
                return (
                  <div
                    className={dropClass}
                    style={{
                      position: "absolute",
                      left: ((dropHover.hour ?? settings.visibleFrom) - settings.visibleFrom) * HOUR_W,
                      top,
                      width: HOUR_W * 2,
                      height: rowH,
                    }}
                  />
                )
              })()}

            {rowVirtualizer.getVirtualItems().map((vr) => {
              const row = flatRows[vr.index]
              if (!row) return null
              const cat = row.category
              const c = getColor(cat.colorIdx)

              // ── Category mode: render all shifts for this category in the row ──
              if (row.kind === "category") {
                if (rowMode !== "category" || collapsed.has(cat.id)) return null
                const catTop = vr.start
                return dates.map((date, di) => {
                  const dayShifts = shiftIndex.get(`${cat.id}:${toDateISO(date)}`) ?? []
                  const sorted = [...dayShifts].sort((a, b) => a.startH - b.startH)
                  const trackNums = packShifts(sorted)
                  return sorted.map((shift, si) => {
                    const track = trackNums[si] ?? 0
                    const isDraft = shift.status === "draft"
                    const isDrag = dragId === shift.id
                    let left: number, width: number
                    if (isWeekView) {
                      const cs = Math.max(shift.startH, settings.visibleFrom)
                      const ce = Math.min(shift.endH, settings.visibleTo)
                      if (ce <= cs) return null
                      left = di * COL_W_WEEK + (cs - settings.visibleFrom) * PX_WEEK + 1
                      width = Math.max((ce - cs) * PX_WEEK - 2, 12)
                    } else if (isDayViewMultiDay) {
                      const cs = Math.max(shift.startH, settings.visibleFrom)
                      const ce = Math.min(shift.endH, settings.visibleTo)
                      if (ce <= cs) return null
                      left = di * DAY_WIDTH + (cs - settings.visibleFrom) * HOUR_W + 2
                      width = Math.max((ce - cs) * HOUR_W - 4, 18)
                    } else {
                      const cs = Math.max(shift.startH, settings.visibleFrom)
                      const ce = Math.min(shift.endH, settings.visibleTo)
                      if (ce <= cs) return null
                      left = (cs - settings.visibleFrom) * HOUR_W + 2
                      width = Math.max((ce - cs) * HOUR_W - 4, 18)
                    }
                    const top = catTop + ROLE_HDR + track * SHIFT_H + 3
                    const variant = settings.badgeVariant ?? "both"
                    const canDrag = (variant === "drag" || variant === "both") && shift.draggable !== false
                    const showResize = !readOnly && (variant === "resize" || variant === "both") && width >= 48 && shift.resizable !== false
                    const isDeleting = deletingIds.has(shift.id)
                    const isNew = newlyAddedIds.has(shift.id)
                    const isDropConflict = dropConflictId === shift.id
                    const isSelected = selectedBlockIds.has(shift.id)
                    const isActivating = activatingBlockId === shift.id
                    const hasConflict = conflictIds.has(shift.id)
                    const isPast = shift.date < toDateISO(new Date()) || (sameDay(shift.date, new Date()) && shift.endH < nowH)
                    const isLive = sameDay(shift.date, new Date()) && nowH >= shift.startH && nowH < shift.endH
                    const blockStyle: React.CSSProperties = {
                      position: "absolute", left, top, width,
                      height: SHIFT_H - 6, borderRadius: 6,
                      cursor: canDrag ? (isDrag ? "grabbing" : isTouchDevice ? "default" : "grab") : "default",
                      userSelect: "none",
                      touchAction: isDrag ? "none" : isTouchDevice ? "pan-y" : "none",
                      opacity: isDrag ? 0.85 : isDeleting ? 0 : isPast ? 0.6 : 1,
                      zIndex: isDrag ? 50 : isSelected ? 12 : isActivating ? 15 : 8,
                      overflow: "visible", display: "flex", alignItems: "center",
                      background: isDraft ? "transparent" : `linear-gradient(135deg,${c.bg},${c.bg}cc)`,
                      border: isDraft ? `1.5px dashed ${c.bg}` : isSelected ? `2px solid ${c.bg}` : `1px solid ${c.bg}88`,
                      boxShadow: isDrag ? `0 20px 40px -8px ${c.bg}60, 0 8px 16px -4px rgba(0,0,0,0.2)` : isDraft ? "none" : `0 2px 6px ${c.bg}44`,
                      transition: isDrag ? "transform 100ms ease-out, box-shadow 100ms ease-out" : isDeleting ? "opacity 150ms ease-out" : "transform 150ms ease-out",
                      contain: "layout style", willChange: isDrag ? "transform" : "auto",
                    }
                    if (isDrag) {
                      blockStyle.left = 0
                      blockStyle.top = 0
                      blockStyle.zIndex = 200
                      blockStyle.pointerEvents = "none"
                      blockStyle.boxShadow = `0 20px 48px -8px ${c.bg}70, 0 8px 24px -4px rgba(0,0,0,0.25)`
                      // transform set by DOM in onPM, reset on drop in onPU/onPC
                    } else if (isActivating) blockStyle.transform = "scale(1.06)"
                    return (
                      <ContextMenu key={shift.id}>
                        <ContextMenuTrigger asChild>
                      <div
                        ref={(el) => { blockRefsRef.current[shift.id] = el }}
                        role="button" tabIndex={0}
                        aria-label={`${shift.employee}, ${getTimeLabel(shift.date, shift.startH)} to ${getTimeLabel(shift.date, shift.endH)}, ${cat.name}`}
                        data-scheduler-block
                        onPointerEnter={() => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = setTimeout(() => setTooltipBlockId(shift.id), TOOLTIP_HOVER_MS) }}
                        onPointerLeave={() => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); tooltipTimerRef.current = null; if (tooltipLeaveTimerRef.current) clearTimeout(tooltipLeaveTimerRef.current); tooltipLeaveTimerRef.current = setTimeout(() => setTooltipBlockId(null), TOOLTIP_LEAVE_MS) }}
                        onPointerDown={canDrag ? (e: React.PointerEvent<HTMLDivElement>) => onBD(e, shift) : undefined}
                        onDoubleClick={(e) => { e.stopPropagation(); if (!dragId) onShiftClick(shift, cat) }}
                        onKeyDown={(e) => onBlockKeyDown(e, shift, cat)}
                        className={cn("group/block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", isNew && "animate-[scaleIn_120ms_ease-out]", (isDropConflict || hasConflict) && "ring-2 ring-destructive border-destructive", isDraft && "opacity-90", isLive && "shadow-[0_0_0_2px_var(--primary)/0.4]")}
                        style={blockStyle}
                      >


                        {/* Break gap indicator */}
                        {shift.breakStartH !== undefined && shift.breakEndH !== undefined && (() => {
                          const dur = shift.endH - shift.startH
                          if (dur <= 0) return null
                          const breakLeft = ((shift.breakStartH - shift.startH) / dur) * 100
                          const breakWidth = ((shift.breakEndH - shift.breakStartH) / dur) * 100
                          return (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: `${breakLeft}%`,
                                width: `${Math.max(breakWidth, 2)}%`,
                                height: "100%",
                                background: "rgba(0,0,0,0.18)",
                                borderLeft: "1px solid rgba(255,255,255,0.4)",
                                borderRight: "1px solid rgba(255,255,255,0.4)",
                                pointerEvents: "none",
                                zIndex: 2,
                              }}
                              title={`Break ${shift.breakStartH}:00–${shift.breakEndH}:00`}
                            />
                          )
                        })()}
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 12px", flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                            {hasConflict && <AlertTriangle size={9} className="shrink-0 text-destructive" style={{ flexShrink: 0 }} />}
                            <span style={{ fontSize: 10, fontWeight: 700, color: isDraft ? c.bg : "rgba(255,255,255,0.97)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.2" }}>
                              {shift.employee}
                            </span>
                          </div>
                          <span style={{ fontSize: 9, color: isDraft ? c.bg : "rgba(255,255,255,0.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.2", marginTop: 1 }}>
                            {getTimeLabel(shift.date, shift.startH)}–{getTimeLabel(shift.date, shift.endH)}
                          </span>
                        </div>

                        {showResize && (
                          <div data-resize="left" onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRLD(e, shift)} className="absolute left-0 top-0 h-full cursor-ew-resize flex items-center justify-center" style={{ width: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : 9, background: "var(--primary)", borderRadius: "6px 0 0 6px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}><div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--primary-foreground)" }} /><div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--primary-foreground)" }} /><div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--primary-foreground)" }} /></div>
                          </div>
                        )}
                        {showResize && (
                          <div data-resize="right" onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRRD(e, shift)} className="absolute right-0 top-0 h-full cursor-ew-resize flex items-center justify-center" style={{ width: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : 9, background: "var(--primary)", borderRadius: "0 6px 6px 0" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}><div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--primary-foreground)" }} /><div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--primary-foreground)" }} /><div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--primary-foreground)" }} /></div>
                          </div>
                        )}
                      </div>
                        </ContextMenuTrigger>

                      <ContextMenuContent>
                        <ContextMenuLabel style={{ color: c.bg }}>{shift.employee}</ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => onShiftClick(shift, cat)}
                          className="gap-2"
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                          Edit shift
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => setCopiedShift?.(shift)}
                          className="gap-2"
                        >
                          <Copy size={14} className="text-muted-foreground" />
                          Copy shift
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            setCopiedShift?.(shift)
                            if (onDeleteShift) {
                              // Cut = copy to buffer + immediately remove from grid
                              setShifts((prev) => prev.filter((s) => s.id !== shift.id))
                              onBlockDelete?.(shift)
                            }
                          }}
                          className="gap-2"
                        >
                          <Scissors size={14} className="text-muted-foreground" />
                          Cut shift
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        {onDeleteShift && (
                          <ContextMenuItem
                            onClick={() => setShiftToDeleteConfirm(shift)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} />
                            Delete shift
                          </ContextMenuItem>
                        )}
                      </ContextMenuContent>
                      </ContextMenu>
                    )
                  })
                })
              }

              // ── Individual mode: render this employee's shifts only ──
              const emp = row.employee!
              if (collapsed.has(cat.id)) return null
              const catTop = vr.start
              return dates.map((date, di) => {
                // Only render shifts belonging to this specific employee
                const allDayShifts = shiftIndex.get(`${cat.id}:${toDateISO(date)}`) ?? []
                const dayShifts = allDayShifts.filter((s) => s.employeeId === emp.id)
                const sorted = [...dayShifts].sort((a, b) => a.startH - b.startH)
                const trackNums = packShifts(sorted)
                return sorted.map((shift, si) => {
                  if (isLoading) {
                    const track = trackNums[si] ?? 0
                    let left: number, width: number
                    if (isWeekView) {
                      const cs = Math.max(shift.startH, settings.visibleFrom)
                      const ce = Math.min(shift.endH, settings.visibleTo)
                      left = di * COL_W_WEEK + (cs - settings.visibleFrom) * PX_WEEK + 1
                      width = Math.max((ce - cs) * PX_WEEK - 2, 12)
                    } else if (isDayViewMultiDay) {
                      const cs = Math.max(shift.startH, settings.visibleFrom)
                      const ce = Math.min(shift.endH, settings.visibleTo)
                      left = di * DAY_WIDTH + (cs - settings.visibleFrom) * HOUR_W + 2
                      width = Math.max((ce - cs) * HOUR_W - 4, 18)
                    } else {
                      const cs = Math.max(shift.startH, settings.visibleFrom)
                      const ce = Math.min(shift.endH, settings.visibleTo)
                      left = (cs - settings.visibleFrom) * HOUR_W + 2
                      width = Math.max((ce - cs) * HOUR_W - 4, 18)
                    }
                    const top = catTop + track * SHIFT_H + 3
                    return (
                      <div
                        key={shift.id}
                        className="animate-pulse rounded-md bg-muted"
                        style={{ position: "absolute", left, top, width, height: SHIFT_H - 6 }}
                      />
                    )
                  }
                  const track = trackNums[si] ?? 0
                  const isDraft = shift.status === "draft"
                  const isDrag = dragId === shift.id
                  const top = catTop + track * SHIFT_H + 3
                  let left: number, width: number
                  if (isWeekView) {
                    const cs = Math.max(shift.startH, settings.visibleFrom)
                    const ce = Math.min(shift.endH, settings.visibleTo)
                    if (ce <= cs) return null
                    left = di * COL_W_WEEK + (cs - settings.visibleFrom) * PX_WEEK + 1
                    width = Math.max((ce - cs) * PX_WEEK - 2, 12)
                  } else if (isDayViewMultiDay) {
                    const cs = Math.max(shift.startH, settings.visibleFrom)
                    const ce = Math.min(shift.endH, settings.visibleTo)
                    if (ce <= cs) return null
                    left = di * DAY_WIDTH + (cs - settings.visibleFrom) * HOUR_W + 2
                    width = Math.max((ce - cs) * HOUR_W - 4, 18)
                  } else {
                    const cs = Math.max(shift.startH, settings.visibleFrom)
                    const ce = Math.min(shift.endH, settings.visibleTo)
                    if (ce <= cs) return null
                    left = (cs - settings.visibleFrom) * HOUR_W + 2
                    width = Math.max((ce - cs) * HOUR_W - 4, 18)
                  }
                  const variant = settings.badgeVariant ?? "both"
                  const canDrag = (variant === "drag" || variant === "both") && shift.draggable !== false
                  const showResize = !readOnly && (variant === "resize" || variant === "both") && width >= 48 && shift.resizable !== false
                  const isLive = sameDay(shift.date, new Date()) && nowH >= shift.startH && nowH < shift.endH
                  const isPast = shift.date < toDateISO(new Date()) || (sameDay(shift.date, new Date()) && shift.endH < nowH)
                  const isDeleting = deletingIds.has(shift.id)
                  const isNew = newlyAddedIds.has(shift.id)
                  const isDropConflict = dropConflictId === shift.id
                  const isSelected = selectedBlockIds.has(shift.id)
                  const isActivating = activatingBlockId === shift.id
                  const hasConflict = conflictIds.has(shift.id)
                  const blockStyle: React.CSSProperties = {
                    position: "absolute", left, top, width,
                    height: SHIFT_H - 6, borderRadius: 6,
                    cursor: canDrag ? (isDrag ? "grabbing" : isTouchDevice ? "default" : "grab") : "default",
                    userSelect: "none",
                    touchAction: isDrag ? "none" : isTouchDevice ? "pan-y" : "none",
                    opacity: isDrag ? 0.85 : isDeleting ? 0 : isPast ? 0.6 : 1,
                    zIndex: isDrag ? 50 : isSelected ? 12 : isActivating ? 15 : 8,
                    overflow: "visible", display: "flex", alignItems: "center",
                    background: isDraft ? "transparent" : `linear-gradient(135deg,${c.bg},${c.bg}cc)`,
                    border: isDraft ? `1.5px dashed ${c.bg}` : isSelected ? `2px solid ${c.bg}` : `1px solid ${c.bg}88`,
                    boxShadow: isDrag
                      ? `0 20px 40px -8px ${c.bg}60, 0 8px 16px -4px rgba(0,0,0,0.2)`
                      : isActivating ? `0 8px 24px -4px ${c.bg}80, 0 0 0 3px ${c.bg}33`
                      : isDraft ? "none"
                      : isSelected ? `0 0 0 3px ${c.bg}44, 0 2px 6px ${c.bg}44`
                      : `0 2px 6px ${c.bg}44`,
                    transition: isDrag
                      ? "transform 100ms ease-out, box-shadow 100ms ease-out"
                      : isActivating ? "transform 200ms ease-out, box-shadow 200ms ease-out"
                      : isDeleting ? "opacity 150ms ease-out"
                      : "transform 150ms ease-out",
                    contain: "layout style paint",
                    willChange: isDrag ? "transform" : "auto",
                  }
                  if (isDrag) {
                    blockStyle.left = 0
                    blockStyle.top = 0
                    blockStyle.zIndex = 200
                    blockStyle.pointerEvents = "none"
                    blockStyle.boxShadow = `0 20px 48px -8px ${c.bg}70, 0 8px 24px -4px rgba(0,0,0,0.25)`
                  } else if (isActivating) blockStyle.transform = "scale(1.06)"
                  const showTooltip = tooltipBlockId === shift.id
                  const conflictCount = getConflictCount(shifts, shift.id)
                  const blockSlotProps = {
                    block: shift, resource: cat, isDraft, isDragging: isDrag,
                    hasConflict, widthPx: width, onDoubleClick: () => onShiftClick(shift, cat),
                  }
                  return (
                    <ContextMenu key={shift.id}>
                      <ContextMenuTrigger asChild>
                    <div
                      ref={(el) => { blockRefsRef.current[shift.id] = el }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${shift.employee}, ${getTimeLabel(shift.date, shift.startH)} to ${getTimeLabel(shift.date, shift.endH)}, ${cat.name}`}
                      data-scheduler-block
                      onPointerEnter={() => {
                        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
                        tooltipTimerRef.current = setTimeout(() => setTooltipBlockId(shift.id), TOOLTIP_HOVER_MS)
                      }}
                      onPointerLeave={() => {
                        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
                        tooltipTimerRef.current = null
                        if (tooltipLeaveTimerRef.current) clearTimeout(tooltipLeaveTimerRef.current)
                        tooltipLeaveTimerRef.current = setTimeout(() => setTooltipBlockId(null), TOOLTIP_LEAVE_MS)
                      }}
                      onPointerDown={canDrag ? (e: React.PointerEvent<HTMLDivElement>) => onBD(e, shift) : undefined}
                      onDoubleClick={(e) => { e.stopPropagation(); if (!dragId) onShiftClick(shift, cat) }}
                      onKeyDown={(e) => onBlockKeyDown(e, shift, cat)}
                      className={cn(
                        "group/block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isNew && "animate-[scaleIn_120ms_ease-out]",
                        (isDropConflict || hasConflict) && "ring-2 ring-destructive border-destructive",
                        isDraft && "opacity-90",
                        isLive && "shadow-[0_0_0_2px_var(--primary)/0.4]"
                      )}
                      style={blockStyle}
                    >
                      {slots.block ? slots.block(blockSlotProps) : (
                        <>
                          
                          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 12px", flex: 1, minWidth: 0, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                              {hasConflict && <AlertTriangle size={9} className="shrink-0 text-destructive" style={{ flexShrink: 0 }} />}
                              <span style={{ fontSize: 10, fontWeight: 700, color: isDraft ? c.bg : "rgba(255,255,255,0.97)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.2" }}>
                                {shift.employee}
                              </span>
                            </div>
                            <span style={{ fontSize: 9, color: isDraft ? c.bg : "rgba(255,255,255,0.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.2", marginTop: 1 }}>
                              {getTimeLabel(shift.date, shift.startH)}–{getTimeLabel(shift.date, shift.endH)}
                            </span>
                          </div>
                          {/* Break gap indicator */}
                          {shift.breakStartH !== undefined && shift.breakEndH !== undefined && (() => {
                            const dur = shift.endH - shift.startH
                            if (dur <= 0) return null
                            const breakLeft = ((shift.breakStartH - shift.startH) / dur) * 100
                            const breakWidth = ((shift.breakEndH - shift.breakStartH) / dur) * 100
                            return (
                              <div
                                style={{
                                  position: "absolute", top: 0,
                                  left: `${breakLeft}%`,
                                  width: `${Math.max(breakWidth, 2)}%`,
                                  height: "100%",
                                  background: "rgba(0,0,0,0.18)",
                                  borderLeft: "1px solid rgba(255,255,255,0.4)",
                                  borderRight: "1px solid rgba(255,255,255,0.4)",
                                  pointerEvents: "none", zIndex: 2,
                                }}
                                title={`Break ${shift.breakStartH}:00–${shift.breakEndH}:00`}
                              />
                            )
                          })()}

                          {showResize && (
                            <div
                              data-resize="left"
                              onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRLD(e, shift)}

                              className="absolute left-0 top-0 flex h-full cursor-ew-resize items-center justify-center"
                              style={{
                                width: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : 9,
                                minWidth: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : undefined,
                                background: "var(--primary)",
                                borderRadius: "6px 0 0 6px",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}>
                                <div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--background)" }} />
                                <div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--background)" }} />
                                <div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--background)" }} />
                              </div>
                            </div>
                          )}
                          {showResize && (
                            <div
                              data-resize="right"
                              onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRRD(e, shift)}

                              className="absolute right-0 top-0 flex h-full cursor-ew-resize items-center justify-center"
                              style={{
                                width: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : 9,
                                minWidth: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : undefined,
                                background: "var(--primary)",
                                borderRadius: "0 6px 6px 0",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}>
                                <div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--background)" }} />
                                <div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--background)" }} />
                                <div style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--background)" }} />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                      </ContextMenuTrigger>

                    <ContextMenuContent>
                      <ContextMenuLabel style={{ color: c.bg }}>{shift.employee}</ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                          onClick={() => onShiftClick(shift, cat)}
                          className="gap-2"
                        >
                      <Pencil size={14} className="text-muted-foreground" />
                          Edit shift
                      </ContextMenuItem>
                      <ContextMenuItem
                          onClick={() => setCopiedShift?.(shift)}
                          className="gap-2"
                        >
                      <Copy size={14} className="text-muted-foreground" />
                          Copy shift
                      </ContextMenuItem>
                      <ContextMenuItem
                          onClick={() => {
                            setCopiedShift?.(shift)
                            if (onDeleteShift) {
                              setShifts((prev) => prev.filter((s) => s.id !== shift.id))
                              onBlockDelete?.(shift)
                            }
                          }}
                          className="gap-2"
                        >
                      <Scissors size={14} className="text-muted-foreground" />
                          Cut shift
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                        {onDeleteShift && (
                      <ContextMenuItem
                            onClick={() => setShiftToDeleteConfirm(shift)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                        <Trash2 size={14} />
                            Delete shift
                      </ContextMenuItem>
                        )}
                    </ContextMenuContent>
                    </ContextMenu>
                  )
                })
              })
            })}

            {!isLoading &&
              !readOnly &&
              flatRows
                .filter((row) => row.kind === "employee" && row.employee &&
                  !collapsed.has(row.category.id) &&
                  !categoryHasShifts[row.category.id])
                .map((row) => {
                  const cat = row.category
                  const top = (categoryTops[`emp:${row.employee!.id}`] ?? 0)
                  const rowH = categoryHeights[`emp:${row.employee!.id}`] ?? SHIFT_H
                  const centerDate = dates[Math.floor(dates.length / 2)] ?? dates[0]!
                  return (
                    <div
                      key={`empty-row-${row.key}`}
                      className="flex items-center justify-center gap-2 rounded border border-dashed border-muted-foreground/40 bg-muted/20"
                      style={{
                        position: "absolute",
                        left: 0,
                        top,
                        width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                        height: rowH,
                        zIndex: 5,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onAddShift(centerDate, cat.id)}
                        className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                      >
                        <Plus size={14} />
                        Add {labels.shift}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            {hasDayScrollNav && (
              <div style={{ width: DAY_SCROLL_BUFFER, flexShrink: 0, minWidth: DAY_SCROLL_BUFFER }} />
            )}
          </div>
        </div>
      </div>

      {/* Hover popover — rendered via portal so it escapes all scroll/overflow/contain clipping */}
      {tooltipBlockId && (() => {
        const shift = shifts.find((s) => s.id === tooltipBlockId)
        if (!shift) return null
        const blockEl = blockRefsRef.current[tooltipBlockId]
        const r = blockEl?.getBoundingClientRect()
        if (!r) return null
        const cat = CATEGORIES.find((c) => c.id === shift.categoryId)
        if (!cat) return null
        const c = getColor(cat.colorIdx)
        const dur = shift.endH - shift.startH
        const hrs = dur % 1 === 0 ? `${dur}h` : `${dur.toFixed(1)}h`
        const hasConflict = conflictIds.has(shift.id)
        const isDraft = shift.status === "draft"
        const showBelow = r.top < 140
        const popTop = showBelow ? r.bottom + 8 : r.top - 8
        const popLeft = Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120)
        return createPortal(
          <div
            onPointerEnter={() => { if (tooltipLeaveTimerRef.current) clearTimeout(tooltipLeaveTimerRef.current) }}
            onPointerLeave={() => { tooltipLeaveTimerRef.current = setTimeout(() => setTooltipBlockId(null), TOOLTIP_LEAVE_MS) }}
            style={{
              position: "fixed",
              top: showBelow ? popTop : undefined,
              bottom: showBelow ? undefined : `${window.innerHeight - popTop}px`,
              left: popLeft,
              transform: "translateX(-50%)",
              zIndex: 99999,
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 14px",
              minWidth: 190,
              maxWidth: 280,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              pointerEvents: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.bg, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{shift.employee}</span>
            </div>
            <div style={{ fontSize: 11, color: c.bg, fontWeight: 600, marginBottom: 5 }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: "var(--foreground)", fontWeight: 600 }}>
              {getTimeLabel(shift.date, shift.startH)} – {getTimeLabel(shift.date, shift.endH)}
              <span style={{ fontWeight: 400, color: "var(--muted-foreground)", marginLeft: 6 }}>{hrs}</span>
            </div>
            {shift.breakStartH !== undefined && (
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>
                Break: {getTimeLabel(shift.date, shift.breakStartH!)}–{getTimeLabel(shift.date, shift.breakEndH!)}
              </div>
            )}
            {hasConflict && (
              <div style={{ marginTop: 7, padding: "4px 8px", borderRadius: 6, background: "var(--destructive)", color: "var(--destructive-foreground)", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={10} />
                Shift conflict — cannot publish
              </div>
            )}
            {isDraft && !hasConflict && (
              <div style={{ marginTop: 5, fontSize: 10, color: "var(--muted-foreground)" }}>Draft — not published</div>
            )}
          </div>,
          document.body
        )
      })()}

      {/* Multi-select bulk action bar */}
      {selectedBlockIds.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
            {selectedBlockIds.size} selected
          </span>
          <button
            type="button"
            onClick={deleteSelectedBlocks}
            style={{
              background: "var(--destructive)",
              color: "var(--destructive-foreground)",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelectedBlockIds(new Set())}
            style={{
              background: "transparent",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      )}

      {staffPanel &&
        (() => {
          const cat = CATEGORIES.find((c) => c.id === staffPanel.categoryId)
          const date = dates[isWeekView || isDayViewMultiDay ? Math.floor(dates.length / 2) : 0]
          const dayShifts = shifts.filter((s) => sameDay(s.date, date))
          return cat ? (
            <StaffPanel
              category={cat}
              date={date}
              dayShifts={dayShifts}
              anchorRect={isTablet ? null : staffPanel.anchorRect}
              variant={isTablet ? "drawer" : "popover"}
              onDragStaff={({ empId, categoryId, empName, pointerId }) => {
                staffDragRef.current = { empId, fromCategoryId: categoryId, empName, pointerId }
                setDragEmpId(empId)
                setIsStaffDragging(true)
              }}
              onClose={() => setStaffPanel(null)}
            />
          ) : null
        })()}

      {shiftToDeleteConfirm && onDeleteShift && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setShiftToDeleteConfirm(null)}
        >
          <div
            style={{
              background: "var(--background)",
              borderRadius: 12,
              padding: 20,
              maxWidth: 340,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--foreground)" }}>
              Delete shift?
            </div>
            <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 16 }}>
              This shift will be removed. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShiftToDeleteConfirm(null)}
                style={{
                  padding: "8px 16px",
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = shiftToDeleteConfirm.id
                  onBlockDelete?.(shiftToDeleteConfirm)
                  setShiftToDeleteConfirm(null)
                  setDeletingIds((prev) => new Set([...prev, id]))
                  setTimeout(() => {
                    onDeleteShift?.(id)
                    setDeletingIds((prev) => {
                      const n = new Set(prev)
                      n.delete(id)
                      return n
                    })
                  }, 150)
                }}
                style={{
                  padding: "8px 16px",
                  background: "var(--destructive)",
                  color: "var(--destructive-foreground)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {categoryWarn &&
        (() => {
          if (categoryWarn.onConfirmAction) {
            const emp = ALL_EMPLOYEES.find((e) => e.name === categoryWarn.empName)
            return categoryWarn.fromCategory && categoryWarn.toCategory ? (
              <RoleWarningModal
                emp={emp || null}
                fromCategory={categoryWarn.fromCategory}
                toCategory={categoryWarn.toCategory}
                onConfirm={() => {
                  categoryWarn.onConfirmAction?.()
                  setCategoryWarn(null)
                }}
                onCancel={() => setCategoryWarn(null)}
              />
            ) : null
          }
          const { shift, newCategoryId, ns, ne, newDate } = categoryWarn
          if (!shift || !newCategoryId || ns === undefined || ne === undefined || !newDate)
            return null
          const emp = ALL_EMPLOYEES.find((e) => e.id === shift.employeeId)
          const fromCategory = CATEGORIES.find((c) => c.id === emp?.categoryId)
          const toCategory = CATEGORIES.find((c) => c.id === newCategoryId)
          return fromCategory && toCategory ? (
            <RoleWarningModal
              emp={emp || null}
              fromCategory={fromCategory}
              toCategory={toCategory}
              onConfirm={() => {
                setShifts((prev) =>
                  prev.map((s) =>
                    s.id === shift.id
                      ? { ...s, startH: ns, endH: ne, categoryId: newCategoryId, date: newDate }
                      : s
                  )
                )
                setCategoryWarn(null)
              }}
              onCancel={() => setCategoryWarn(null)}
            />
          ) : null
        })()}

      {addPrompt && (
        <AddShiftModal
          date={addPrompt.date}
          categoryId={addPrompt.categoryId}
          employeeId={addPrompt.employeeId}
          prefillStartH={addPrompt.hour}
          onAdd={(shift) => setShifts((prev) => [...prev, shift])}
          onClose={() => setAddPrompt(null)}
        />
      )}
    </div>
  )
}

export const GridView = React.memo(GridViewInner)
