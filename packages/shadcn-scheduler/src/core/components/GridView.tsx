import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import type { Block, Resource } from "../types"
import { useSchedulerContext } from "../context"
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
import { StaffPanel } from "./StaffPanel"
import { RoleWarningModal } from "./modals/RoleWarningModal"
import { AddShiftModal } from "./modals/AddShiftModal"
import { Plus, Copy, ClipboardPaste, Trash2, AlertTriangle } from "lucide-react"
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
}

interface GhostState {
  ns: number
  ne: number
  categoryId: string
  dayDelta: number
  id: string
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

  const [staffPanel, setStaffPanel] = useState<StaffPanelState | null>(null)
  const [dragEmpId, setDragEmpId] = useState<string | null>(null)
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

  const displayShifts = isLoading ? skeletonBlocks : shifts.filter((s) => selEmps.has(s.employeeId))
  const categoryHeights = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}
    CATEGORIES.forEach((cat) => {
      if (collapsed.has(cat.id)) {
        map[cat.id] = ROLE_HDR
        return
      }
      let maxH = ROLE_HDR + SHIFT_H
      dates.forEach((date) => {
        const dayShifts = displayShifts.filter(
          (s) => sameDay(s.date, date) && (isLoading || selEmps.has(s.employeeId))
        )
        const h = getCategoryRowHeight(cat.id, dayShifts)
        if (h > maxH) maxH = h
      })
      map[cat.id] = maxH
    })
    return map
  }, [displayShifts, dates, selEmps, CATEGORIES, collapsed, isLoading])

  const categoryTops = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}
    let acc = 0
    CATEGORIES.forEach((c) => {
      map[c.id] = acc
      acc += categoryHeights[c.id]
    })
    return map
  }, [categoryHeights, CATEGORIES])

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

  // Log conflicts only for the current visible range (week/day) to avoid overwhelming output.
  useEffect(() => {
    if (conflictIds.size === 0) return
    const conflicting = visibleShifts.filter((s) => conflictIds.has(s.id))
    console.log("[scheduler] conflicts detected in visible range:", conflictIds.size, "blocks", conflicting.map((s) => ({
      id: s.id,
      employee: s.employee,
      employeeId: s.employeeId,
      date: s.date,
      startH: s.startH,
      endH: s.endH,
      categoryId: s.categoryId,
    })))
  }, [visibleShifts, conflictIds])


  const orderedBlockIds = useMemo((): string[] => {
    const ids: string[] = []
    CATEGORIES.forEach((cat) => {
      dates.forEach((date) => {
        const dayShifts = shifts.filter(
          (s) =>
            sameDay(s.date, date) &&
            s.categoryId === cat.id &&
            selEmps.has(s.employeeId)
        )
        const sorted = [...dayShifts].sort((a, b) => a.startH - b.startH)
        sorted.forEach((s) => ids.push(s.id))
      })
    })
    return ids
  }, [shifts, dates, CATEGORIES, selEmps])

  const totalH = useMemo(
    (): number => CATEGORIES.reduce((s, c) => s + categoryHeights[c.id], 0),
    [categoryHeights, CATEGORIES]
  )

  const ds = useRef<DragState | null>(null)
  const [ghost, setGhost] = useState<GhostState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const gridPointerIdsRef = useRef<Set<number>>(new Set())
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null)
  const longPressPointerIdRef = useRef<number | null>(null)
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
      if (y < 0) return CATEGORIES[0]
      let acc = 0
      for (const cat of CATEGORIES) {
        const h = categoryHeights[cat.id]
        if (y >= acc && y < acc + h) return cat
        acc += h
      }
      return CATEGORIES[CATEGORIES.length - 1]
    },
    [categoryHeights, CATEGORIES]
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

  const cleanupPointer = useCallback((pointerId: number) => {
    gridPointerIdsRef.current.delete(pointerId)
    if (longPressPointerIdRef.current === pointerId) clearLongPress()
    pinchPointersRef.current.delete(pointerId)
    if (pinchPointersRef.current.size < 2) initialPinchDistRef.current = null
  }, [clearLongPress])

  const onBD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Block): void => {
      if (readOnly) return
      if ((e.target as HTMLElement).dataset.resize) return
      if (gridPointerIdsRef.current.size >= 2) return
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const { x, y } = getGridXY(e.clientX, e.clientY)
      ds.current = {
        type: "move",
        id: shift.id,
        sx: x,
        sy: y,
        startH: shift.startH,
        endH: shift.endH,
        categoryId: shift.categoryId,
        empId: shift.employeeId,
        dur: shift.endH - shift.startH,
      }
      setDragId(shift.id)
    },
    [getGridXY, readOnly]
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
        if (onDeleteShift && window.confirm("Remove this block?")) {
          onDeleteShift(shift.id)
          setFocusedBlockId(null)
        }
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
    ]
  )

  const EDGE_SCROLL_ZONE = 80
  const EDGE_SCROLL_SPEED = 12

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

      // Auto-scroll when dragging near edges so user can reach off-screen days
      if (d.type === "move" && scrollRef.current && (isWeekView || isDayViewMultiDay)) {
        const sr = scrollRef.current.getBoundingClientRect()
        const px = e.clientX - sr.left
        const vw = sr.width
        if (px < EDGE_SCROLL_ZONE && px >= 0) {
          scrollRef.current.scrollLeft -= EDGE_SCROLL_SPEED
          if (headerRef.current) headerRef.current.scrollLeft = scrollRef.current.scrollLeft
        } else if (px > vw - EDGE_SCROLL_ZONE && px <= vw) {
          scrollRef.current.scrollLeft += EDGE_SCROLL_SPEED
          if (headerRef.current) headerRef.current.scrollLeft = scrollRef.current.scrollLeft
        }
      }

      if (d.type === "move") {
        const dx = x - d.sx
        const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
        const di1 = getDateIdx(x)
        const dayDelta = di1 - di0
        // When moving between days, preserve original hours; only apply offset within same day
        const hourOffset =
          dayDelta !== 0
            ? 0
            : isWeekView
              ? snapH(dx / PX_WEEK)
              : isDayViewMultiDay
                ? snapH(dx / HOUR_W)
                : snapH(dx / HOUR_W)
        const ns = snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
        setGhost({ ns, ne: ns + d.dur, categoryId: newCat.id, dayDelta, id: d.id })
      } else if (d.type === "resize-right") {
        const pxPerH = isWeekView ? PX_WEEK : isDayViewMultiDay ? HOUR_W : HOUR_W
        const ne = snapH(clamp(d.endH + (x - d.sx) / pxPerH, d.startH + SNAP, 24))
        setGhost({ ns: d.startH, ne, categoryId: d.categoryId, dayDelta: 0, id: d.id })
      } else {
        const pxPerH = isWeekView ? PX_WEEK : isDayViewMultiDay ? HOUR_W : HOUR_W
        const ns = snapH(clamp(d.startH + (x - d.sx) / pxPerH, 0, d.endH - SNAP))
        setGhost({ ns, ne: d.endH, categoryId: d.categoryId, dayDelta: 0, id: d.id })
      }
    },
    [getGridXY, getCategoryAtY, getDateIdx, isWeekView, isDayViewMultiDay, COL_W_WEEK, DAY_WIDTH, PX_WEEK, HOUR_W, clearLongPress, setZoom, onPinchZoom]
  )

  const onPC = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      ds.current = null
      setDragId(null)
      setGhost(null)
    },
    []
  )

  const onPU = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!ds.current) return
      const d = ds.current
      const { x, y } = getGridXY(e.clientX, e.clientY)
      const newCat = getCategoryAtY(y)
      if (d.type === "move") {
        const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
        const di1 = getDateIdx(x)
        const dayDelta = di1 - di0
        const hourOffset =
          dayDelta !== 0
            ? 0
            : isWeekView
              ? snapLocal((x - d.sx) / PX_WEEK)
              : isDayViewMultiDay
                ? snapLocal((x - d.sx) / HOUR_W)
                : snapLocal((x - d.sx) / HOUR_W)
        const ns = snapLocal(clamp(d.startH + hourOffset, 0, 24 - d.dur))
        const origShift = shifts.find((x) => x.id === d.id)
        const newDateIdx = origShift
          ? clamp(dates.findIndex((dt) => sameDay(dt, origShift.date)) + dayDelta, 0, dates.length - 1)
          : 0
        const newDate = isWeekView || isDayViewMultiDay ? toDateISO(dates[newDateIdx]) : origShift?.date ?? ""
        if (origShift && wouldConflictAt(shifts, d.id, { date: newDate, categoryId: newCat.id, startH: ns, endH: ns + d.dur })) {
          setDropConflictId(d.id)
          setTimeout(() => setDropConflictId(null), 800)
          ds.current = null
          setDragId(null)
          setGhost(null)
          return
        }
      }
      ds.current = null
      setDragId(null)
      setGhost(null)
      setShifts((prev) => {
        const next = prev.map((s) => {
          if (s.id !== d.id) return s
          const origEmp = ALL_EMPLOYEES.find((emp) => emp.id === s.employeeId)

          if (d.type === "move") {
            const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
            const di1 = getDateIdx(x)
            const dayDelta = di1 - di0
            const hourOffset =
              dayDelta !== 0
                ? 0
                : isWeekView
                  ? snapLocal((x - d.sx) / PX_WEEK)
                  : snapLocal((x - d.sx) / HOUR_W)
            const ns = snapLocal(clamp(d.startH + hourOffset, 0, 24 - d.dur))
            const origDateIdx = dates.findIndex((dt) => sameDay(dt, s.date))
            const newDateIdx = clamp(origDateIdx + dayDelta, 0, dates.length - 1)
            const newDate =
              isWeekView || isDayViewMultiDay ? toDateISO(dates[newDateIdx]) : s.date

            if (newCat.id !== s.categoryId && origEmp && origEmp.categoryId !== newCat.id) {
              setCategoryWarn({ shift: s, newCategoryId: newCat.id, ns, ne: ns + d.dur, newDate })
              return s
            }
            return { ...s, startH: ns, endH: ns + d.dur, categoryId: newCat.id, date: newDate }
          } else if (d.type === "resize-right") {
            const ne = snapLocal(
              clamp(d.endH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), d.startH + snapHours, 24)
            )
            return { ...s, endH: ne }
          } else {
            const ns = snapLocal(
              clamp(d.startH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), 0, d.endH - snapHours)
            )
            return { ...s, startH: ns }
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
    }
  }, [dragId])

  const onCellDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, categoryId: string, dateIdx: number, hour: number): void => {
      e.preventDefault()
      const empId = e.dataTransfer.getData("empId")
      const fromCategoryId = e.dataTransfer.getData("categoryId")
      if (!empId) return
      const emp = ALL_EMPLOYEES.find((x) => x.id === empId)
      const date = dates[dateIdx]
      const startH = Math.floor(hour)
      const endH = Math.min(startH + 4, 23)

      if (fromCategoryId !== categoryId) {
        const fromCategory = CATEGORIES.find((c) => c.id === fromCategoryId)
        const toCategory = CATEGORIES.find((c) => c.id === categoryId)
        setCategoryWarn({
          empName: emp?.name,
          fromCategory,
          toCategory,
          onConfirmAction: () =>
            setShifts((prev) => [
              ...prev,
              {
                id: nextUid(),
                categoryId,
                employeeId: empId,
                date: toDateISO(date),
                startH,
                endH,
                employee: emp?.name || "?",
                status: "draft",
              },
            ]),
        })
      } else {
        setShifts((prev) => [
          ...prev,
          {
            id: nextUid(),
            categoryId,
            employeeId: empId,
            date: toDateISO(date),
            startH,
            endH,
            employee: emp?.name || "?",
            status: "draft",
          },
        ])
      }
      setDropHover(null)
      setDragEmpId(null)
    },
    [dates, setShifts, ALL_EMPLOYEES, CATEGORIES, nextUid]
  )

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
            borderBottom: "1px solid hsl(var(--border))",
            background: "hsl(var(--muted))",
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
              color: "hsl(var(--muted-foreground))",
              opacity: mobileResourceIndex! <= 0 ? 0.5 : 1,
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>
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
              color: "hsl(var(--muted-foreground))",
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
          borderBottom: "2px solid hsl(var(--border))",
          background: "hsl(var(--muted))",
        }}
      >
        <div
          style={{
            width: SIDEBAR_W,
            flexShrink: 0,
            borderRight: "1px solid hsl(var(--border))",
            display: "flex",
            alignItems: "flex-end",
            padding: "0 12px 6px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "hsl(var(--muted-foreground))",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {labels.categories}
          </span>
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
                          borderRight: "1px solid hsl(var(--border))",
                          background: today ? "hsl(var(--accent))" : closed ? "hsl(var(--muted))" : "transparent",
                          cursor: onDateDoubleClick ? "pointer" : "default",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: today ? "hsl(var(--primary))" : closed ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
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
                            color: today ? "hsl(var(--background))" : closed ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                            background: today ? "hsl(var(--primary))" : "transparent",
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
                                      color: "hsl(var(--muted-foreground))",
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
                          <div style={{ fontSize: 8, color: "hsl(var(--muted-foreground))", fontWeight: 600, marginTop: 1 }}>
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
                    background: "hsl(var(--muted))",
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
                          borderRight: "1px solid hsl(var(--border))",
                          padding: "0 4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: isToday(d) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
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
                          borderRight: "1px solid hsl(var(--border))",
                          background: isToday(d) ? "hsl(var(--accent))" : "transparent",
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
                                borderRight: "1px solid hsl(var(--border))",
                                background: dashed ? DASHED_BG : hourBg(h, settings, d.getDay()),
                                color: (dayTimeStep < 1 ? Math.abs(h - nowH) < 0.3 : h === Math.floor(nowH)) && isToday(d) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
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
                    background: "hsl(var(--muted))",
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
                          borderRight: "1px solid hsl(var(--border))",
                          background: dashed ? DASHED_BG : hourBg(h, settings, dates[0].getDay()),
                          color: (dayTimeStep < 1 ? Math.abs(h - nowH) < 0.3 : h === Math.floor(nowH)) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
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
            width: SIDEBAR_W,
            flexShrink: 0,
            borderRight: "1px solid hsl(var(--border))",
            overflowY: "hidden",
            background: "hsl(var(--muted))",
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
            return CATEGORIES.map((cat) => {
              const c = getColor(cat.colorIdx)
              const h = categoryHeights[cat.id]
              const catShifts = baseShifts.filter((s) => s.categoryId === cat.id)
              const scheduled = catShifts.length
              const totalHours = catShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
              return (
              <div
                key={cat.id}
                title={scheduled > 0 ? `${scheduled} block${scheduled !== 1 ? "s" : ""}, ${totalHours.toFixed(1)}h in this period` : undefined}
                style={{
                  height: h,
                  borderBottom: "1px solid hsl(var(--border))",
                  background: "hsl(var(--muted))",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: ROLE_HDR,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {slots.resourceHeader ? (
                    slots.resourceHeader({
                      resource: cat,
                      scheduledCount: scheduled,
                      isCollapsed: collapsed.has(cat.id),
                      onToggleCollapse: () => toggleCollapse(cat.id),
                    })
                  ) : (
                    <>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.bg,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "hsl(var(--foreground))",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.name}
                  </span>
                  {scheduled > 0 && (
                    <span
                      title="Scheduled in this view"
                      style={{
                        fontSize: 10,
                        color: c.bg,
                        fontWeight: 700,
                        background: c.light,
                        borderRadius: 8,
                        padding: "1px 5px",
                      }}
                    >
                      {scheduled}
                    </span>
                  )}
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      toggleCollapse(cat.id)
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "hsl(var(--muted-foreground))",
                      transform: collapsed.has(cat.id) ? "rotate(-90deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setStaffPanel((p) =>
                        p?.categoryId === cat.id ? null : { categoryId: cat.id, anchorRect: rect }
                      )
                    }}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: c.text,
                      background: c.light,
                      border: `1px solid ${c.border}`,
                      borderRadius: 5,
                      padding: "2px 6px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {labels.staff}
                  </button>
                    </>
                  )}
                </div>
              </div>
            );
            });
          })()}
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
                  height: totalH,
                  minHeight: "100%",
                }}
                tabIndex={0}
                onKeyDown={onGridKeyDown}
                onPointerDown={onGridPointerDown}
                onPointerMove={onPM}
                onPointerUp={onGridPointerUp}
                onPointerCancel={onPC}
              >
            {CATEGORIES.map((cat) => {
              const top = categoryTops[cat.id]
              const rowH = categoryHeights[cat.id]
              return dates.map((date, di) => {
                const closed = settings.workingHours[date.getDay()] === null
                const today = isToday(date)
                if (isDayViewMultiDay) {
                  return DAY_VISIBLE_SLOTS.map((h) => {
                    const dashed = isOutsideWorkingHours(h, settings, date.getDay())
                    return (
                      <div
                        key={`bg-${cat.id}-${di}-${h}`}
                        data-empty-cell
                        role="gridcell"
                        style={{
                          position: "absolute",
                          left: di * DAY_WIDTH + (h - settings.visibleFrom) * HOUR_W,
                          top,
                          width: SLOT_W,
                          height: rowH,
                          background: dashed ? DASHED_BG : hourBg(h, settings, date.getDay()),
                          borderRight: "1px solid hsl(var(--border))",
                        }}
                        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                          e.preventDefault()
                          setDropHover({ categoryId: cat.id, di, hour: h })
                        }}
                        onDrop={(e: React.DragEvent<HTMLDivElement>) => onCellDrop(e, cat.id, di, h)}
                      />
                    )
                  })
                }
                if (isWeekView) {
                  return (
                    <div
                      key={`bg-${cat.id}-${di}`}
                      data-empty-cell
                      role="gridcell"
                      style={{
                        position: "absolute",
                        left: di * COL_W_WEEK,
                        top,
                        width: COL_W_WEEK,
                        height: rowH,
                        background: today ? "hsl(var(--accent))" : closed ? "hsl(var(--muted))" : "hsl(var(--background))",
                        borderRight: "1px solid hsl(var(--border))",
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                        e.preventDefault()
                        setDropHover({ categoryId: cat.id, di })
                      }}
                      onDrop={(e: React.DragEvent<HTMLDivElement>) =>
                        onCellDrop(e, cat.id, di, settings.visibleFrom)
                      }
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
                                borderRight: "1px solid",
                                borderColor: k % 2 === 0 ? "hsl(var(--border))" : "hsl(var(--border))",
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
                    key={`bg-${cat.id}-${h}`}
                    data-empty-cell
                    role="gridcell"
                    style={{
                      position: "absolute",
                      left: (h - settings.visibleFrom) * HOUR_W,
                      top,
                      width: SLOT_W,
                      height: rowH,
                      background: dashed ? DASHED_BG : hourBg(h, settings, date.getDay()),
                      borderRight: "1px solid hsl(var(--border))",
                    }}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                      e.preventDefault()
                      setDropHover({ categoryId: cat.id, hour: h })
                    }}
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => onCellDrop(e, cat.id, 0, h)}
                  />
                )})
              })
            })}

            {CATEGORIES.map((cat) => (
              <div
                key={`sep-${cat.id}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: categoryTops[cat.id] + categoryHeights[cat.id] - 1,
                  width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                  height: 2,
                  background: "hsl(var(--border))",
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              />
            ))}

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
                          height: totalH,
                          background: "hsl(var(--border))",
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
                        height: totalH,
                        background: "hsl(var(--border))",
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
                  className="pointer-events-none absolute top-0 z-[15] h-full w-0.5 bg-destructive/80 shadow-[0_0_6px_hsl(var(--destructive)/0.4)]"
                  style={{
                    left: isWeekView
                      ? di * COL_W_WEEK + (nowH - settings.visibleFrom) * PX_WEEK
                      : isDayViewMultiDay
                        ? di * DAY_WIDTH + (nowH - settings.visibleFrom) * HOUR_W
                        : (nowH - settings.visibleFrom) * HOUR_W,
                    height: totalH,
                  }}
                >
                  <div className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full border border-border bg-destructive/90" />
                </div>
              ) : null
            )}

            {CATEGORIES.map((cat) => {
              if (collapsed.has(cat.id)) return null
              const top = categoryTops[cat.id]
              const rowH = categoryHeights[cat.id]
              const addBtnTop = top + rowH - ADD_BTN_H + (ADD_BTN_H - 20) / 2
              if (isWeekView || isDayViewMultiDay) {
                const colW = isDayViewMultiDay ? DAY_WIDTH : COL_W_WEEK
                return dates.map((date, di) => (
                  <div key={`add-${cat.id}-${di}`} style={{ position: "absolute", left: di * colW + colW / 2 - 10, top: addBtnTop, display: "flex", gap: 4, zIndex: 25 }}>
                    <button
                      onClick={() =>
                        setAddPrompt({ date, categoryId: cat.id, hour: settings.visibleFrom })
                      }
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "1.5px dashed hsl(var(--muted-foreground))",
                        background: "hsl(var(--background))",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "hsl(var(--muted-foreground))",
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
                          }
                          setShifts((prev) => [...prev, newShift])
                          setCopiedShift?.(null)
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: "1.5px dashed hsl(var(--primary))",
                          background: "hsl(var(--background))",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "hsl(var(--primary))",
                          padding: 0,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                        title="Paste Shift"
                      >
                        <ClipboardPaste size={9} />
                      </button>
                    )}
                  </div>
                ))
              }
              return DAY_VISIBLE_SLOTS.map((h) => (
                  <div key={`add-${cat.id}-${h}`} style={{ position: "absolute", left: (h - settings.visibleFrom) * HOUR_W + SLOT_W / 2 - 9, top: addBtnTop, display: "flex", gap: 4, zIndex: 25 }}>
                    <button
                      onClick={() =>
                        setAddPrompt({ date: dates[1] ?? dates[0], categoryId: cat.id, hour: h })
                      }
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "1.5px dashed hsl(var(--muted-foreground))",
                        background: "hsl(var(--background))",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "hsl(var(--muted-foreground))",
                        padding: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
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
                            date: toDateISO(dates[1] ?? dates[0]),
                            categoryId: cat.id,
                            startH: h,
                            endH: h + (copiedShift.endH - copiedShift.startH),
                          }
                          setShifts((prev) => [...prev, newShift])
                          setCopiedShift?.(null)
                        }}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: "1.5px dashed hsl(var(--primary))",
                          background: "hsl(var(--background))",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "hsl(var(--primary))",
                          padding: 0,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                        title="Paste Shift"
                      >
                        <ClipboardPaste size={8} />
                      </button>
                    )}
                  </div>
                )
              )
            })}

            {dropHover &&
              dragEmpId &&
              (() => {
                const cat = CATEGORIES.find((c) => c.id === dropHover.categoryId)
                if (!cat || collapsed.has(cat.id)) return null
                const c = getColor(cat.colorIdx)
                const top = categoryTops[cat.id]
                const rowH = categoryHeights[cat.id]
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

            {ghost &&
              (() => {
                const orig = shifts.find((s) => s.id === ghost.id)
                if (!orig) return null
                const cat = CATEGORIES.find((c) => c.id === ghost.categoryId)
                if (!cat || collapsed.has(cat.id)) return null
                const c = getColor(cat.colorIdx)
                const top = categoryTops[cat.id]
                const rowH = categoryHeights[cat.id]
                let left: number, width: number
                if (isWeekView) {
                  const origDi = dates.findIndex((d) => sameDay(d, orig.date))
                  const newDi = clamp(origDi + (ghost.dayDelta ?? 0), 0, dates.length - 1)
                  left = newDi * COL_W_WEEK + (ghost.ns - settings.visibleFrom) * PX_WEEK
                  width = Math.max((ghost.ne - ghost.ns) * PX_WEEK - 2, 8)
                } else if (isDayViewMultiDay) {
                  const origDi = dates.findIndex((d) => sameDay(d, orig.date))
                  const newDi = clamp(origDi + (ghost.dayDelta ?? 0), 0, dates.length - 1)
                  const cs = Math.max(ghost.ns, settings.visibleFrom)
                  const ce = Math.min(ghost.ne, settings.visibleTo)
                  if (ce <= cs) return null
                  left = newDi * DAY_WIDTH + (cs - settings.visibleFrom) * HOUR_W + 2
                  width = Math.max((ce - cs) * HOUR_W - 4, 10)
                } else {
                  const cs = Math.max(ghost.ns, settings.visibleFrom)
                  const ce = Math.min(ghost.ne, settings.visibleTo)
                  if (ce <= cs) return null
                  left = (cs - settings.visibleFrom) * HOUR_W + 2
                  width = Math.max((ce - cs) * HOUR_W - 4, 10)
                }
                return (
                  <>
                    <div
                      className="bg-primary/10 ring-1 ring-primary/30 pointer-events-none rounded absolute z-[17]"
                      style={{ left, top: top + ROLE_HDR, width, height: rowH }}
                    />
                    <div
                      className="opacity-80 ring-2 ring-primary/50"
                      style={{
                        position: "absolute",
                        left,
                        top: top + ROLE_HDR + 3,
                        width,
                        height: SHIFT_H - 6,
                        background: c.bg,
                        borderRadius: 5,
                        border: `2px dashed ${c.bg}`,
                        pointerEvents: "none",
                        zIndex: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: c.bg,
                          background: "hsl(var(--background))",
                          borderRadius: 3,
                          padding: "1px 4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt12(ghost.ns)}–{fmt12(ghost.ne)}
                      </span>
                    </div>
                  </>
                )
              })()}

            {CATEGORIES.map((cat) => {
              if (collapsed.has(cat.id)) return null
              const catTop = categoryTops[cat.id]
              return dates.map((date, di) => {
                const dayShifts = displayShifts.filter(
                  (s) => sameDay(s.date, date) && s.categoryId === cat.id && (isLoading || selEmps.has(s.employeeId))
                )
                const sorted = [...dayShifts].sort((a, b) => a.startH - b.startH)
                const trackNums = packShifts(sorted)
                const c = getColor(cat.colorIdx)

                return sorted.map((shift, si) => {
                  if (isLoading) {
                    const track = trackNums[si]
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
                    const top = catTop + ROLE_HDR + track * SHIFT_H + 3
                    return (
                      <div
                        key={shift.id}
                        className="animate-pulse rounded-md bg-muted"
                        style={{
                          position: "absolute",
                          left,
                          top,
                          width,
                          height: SHIFT_H - 6,
                        }}
                      />
                    )
                  }
                  const track = trackNums[si]
                  const isDraft = shift.status === "draft"
                  const isDrag = dragId === shift.id
                  const top = catTop + ROLE_HDR + track * SHIFT_H + 3
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
                  const canDrag = variant === "drag" || variant === "both"
                  const showResize = !readOnly && (variant === "resize" || variant === "both") && width >= 48
                  const isLive =
                    sameDay(shift.date, new Date()) &&
                    nowH >= shift.startH &&
                    nowH < shift.endH
                  const isPast =
                    shift.date < toDateISO(new Date()) ||
                    (sameDay(shift.date, new Date()) && shift.endH < nowH)

                  const isDeleting = deletingIds.has(shift.id)
                  const isNew = newlyAddedIds.has(shift.id)
                  const isDropConflict = dropConflictId === shift.id
                  const blockStyle: React.CSSProperties = {
                    position: "absolute",
                    left,
                    top,
                    width,
                    height: SHIFT_H - 6,
                    borderRadius: 5,
                    cursor: canDrag ? (isDrag ? "grabbing" : "grab") : "default",
                    userSelect: "none",
                    touchAction: "none",
                    opacity: isDrag ? 0.3 : isDeleting ? 0 : isPast ? 0.6 : 1,
                    zIndex: isDrag ? 20 : 8,
                    overflow: "visible",
                    display: "flex",
                    alignItems: "center",
                    background: isDraft
                      ? "transparent"
                      : `linear-gradient(135deg,${c.bg},${c.bg}cc)`,
                    border: isDraft ? `1.5px dashed ${c.bg}` : `1px solid ${c.bg}88`,
                    boxShadow: isDrag || isDraft ? "none" : `0 2px 6px ${c.bg}44`,
                    transition: isDeleting ? "opacity 150ms ease-out" : "transform 150ms ease-out",
                  }
                  if (isDrag) {
                    blockStyle.transform = "scale(1.02)"
                    blockStyle.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
                  }

                  const hasConflict = conflictIds.has(shift.id)

                  const blockSlotProps = {
                    block: shift,
                    resource: cat,
                    isDraft,
                    isDragging: isDrag,
                    hasConflict,
                    widthPx: width,
                    onDoubleClick: () => onShiftClick(shift, cat),
                  }

                  const showTooltip = tooltipBlockId === shift.id
                  const conflictCount = getConflictCount(shifts, shift.id)
                  return (
                    <div
                      key={shift.id}
                      data-scheduler-block
                      data-block-id={shift.id}
                      ref={(el) => {
                        blockRefsRef.current[shift.id] = el
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${shift.employee}, ${getTimeLabel(shift.date, shift.startH)} to ${getTimeLabel(shift.date, shift.endH)}, ${cat.name}`}
                      onFocus={() => {
                        setFocusedBlockId(shift.id)
                        onFocusedBlockChange?.(shift.id)
                      }}
                      onBlur={() => {
                        if (focusedBlockId === shift.id) {
                          setFocusedBlockId(null)
                          onFocusedBlockChange?.(null)
                        }
                      }}
                      onKeyDown={(e) => onBlockKeyDown(e, shift, cat)}
                      onPointerEnter={() => {
                        if (tooltipLeaveTimerRef.current) {
                          clearTimeout(tooltipLeaveTimerRef.current)
                          tooltipLeaveTimerRef.current = null
                        }
                        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
                        tooltipTimerRef.current = setTimeout(() => setTooltipBlockId(shift.id), TOOLTIP_HOVER_MS)
                      }}
                      onPointerLeave={() => {
                        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
                        tooltipTimerRef.current = null
                        if (tooltipLeaveTimerRef.current) clearTimeout(tooltipLeaveTimerRef.current)
                        tooltipLeaveTimerRef.current = setTimeout(() => setTooltipBlockId(null), TOOLTIP_LEAVE_MS)
                      }}
                      onPointerDown={
                        canDrag
                          ? (e: React.PointerEvent<HTMLDivElement>) => onBD(e, shift)
                          : undefined
                      }
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        if (!dragId) onShiftClick(shift, cat)
                      }}
                      className={cn(
                        "group/block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isNew && "animate-[scaleIn_120ms_ease-out]",
                        (isDropConflict || hasConflict) && "ring-2 ring-destructive border-destructive",
                        isDraft && "opacity-90",
                        isLive && "shadow-[0_0_0_2px_hsl(var(--primary)/0.4)]"
                      )}
                      style={blockStyle}
                    >
                      {showTooltip && (
                        <div
                          className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md pointer-events-auto"
                          role="tooltip"
                          onPointerEnter={() => {
                            if (tooltipLeaveTimerRef.current) {
                              clearTimeout(tooltipLeaveTimerRef.current)
                              tooltipLeaveTimerRef.current = null
                            }
                            setTooltipBlockId(shift.id)
                          }}
                          onPointerLeave={() => {
                            if (tooltipLeaveTimerRef.current) clearTimeout(tooltipLeaveTimerRef.current)
                            tooltipLeaveTimerRef.current = setTimeout(() => setTooltipBlockId(null), TOOLTIP_LEAVE_MS)
                          }}
                        >
                          <div className="font-semibold">{shift.employee}</div>
                          <div className="text-muted-foreground">
                            {getTimeLabel(shift.date, shift.startH)}–{getTimeLabel(shift.date, shift.endH)} · {cat.name}
                          </div>
                          <div className="capitalize">{shift.status}</div>
                          {hasConflict && (
                            <div className="text-destructive">
                              Overlaps with {conflictCount} other block{conflictCount !== 1 ? "s" : ""}
                            </div>
                          )}
                          {shift.meta && Object.keys(shift.meta).length > 0 && (
                            <div className="mt-0.5 text-muted-foreground">
                              {JSON.stringify(shift.meta)}
                            </div>
                          )}
                        </div>
                      )}
                      {slots.block ? (
                        slots.block(blockSlotProps)
                      ) : (
                        <>
                      {hasConflict && (
                        <span
                          className="absolute right-1 top-0.5 z-10 cursor-help text-destructive"
                          title={conflictCount > 0 ? `Overlaps with ${conflictCount} other block${conflictCount !== 1 ? "s" : ""}` : "Overlapping shifts (conflict)"}
                          onPointerEnter={(e) => {
                            e.stopPropagation()
                            if (tooltipTimerRef.current) {
                              clearTimeout(tooltipTimerRef.current)
                              tooltipTimerRef.current = null
                            }
                            setTooltipBlockId(shift.id)
                          }}
                        >
                          <AlertTriangle size={12} />
                        </span>
                      )}
                      {showResize && (
                      <div
                        data-scheduler-resize-handle
                        data-resize="left"
                        className={cn(
                          "transition-opacity duration-150",
                          !isTouchDevice && "opacity-0 group-hover/block:opacity-100"
                        )}
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRLD(e, shift)}
                        style={{
                          width: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : 9,
                          minWidth: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : undefined,
                          height: "100%",
                          cursor: "ew-resize",
                          flexShrink: 0,
                          background: isDraft ? `${c.bg}22` : "hsl(var(--foreground))",
                          borderRadius: "4px 0 0 4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}>
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 2,
                                height: 2,
                                borderRadius: "50%",
                                background: isDraft ? c.bg : "hsl(var(--background))",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      )}
                      <div
                        style={{
                          flex: 1,
                          padding: "0 3px",
                          overflow: "hidden",
                          pointerEvents: "none",
                          minWidth: 0,
                        }}
                      >
                        {width >= 60 && (
                          <div
                            className="truncate"
                            style={{
                              color: isDraft ? c.bg : "hsl(var(--background))",
                              fontSize: 10,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              minWidth: 0,
                            }}
                          >
                            {isDraft && (
                              <span
                                style={{
                                  fontSize: 8,
                                  background: c.bg,
                                  color: "hsl(var(--background))",
                                  borderRadius: 2,
                                  padding: "0 2px",
                                  flexShrink: 0,
                                }}
                              >
                                D
                              </span>
                            )}
                            {shift.employee.split(" ")[0]}
                          </div>
                        )}
                        {width > 52 && (
                          <div
                            style={{
                              color: isDraft ? c.text : "hsl(var(--background))",
                              fontSize: 9,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {getTimeLabel(shift.date, shift.startH)}–{getTimeLabel(shift.date, shift.endH)}
                          </div>
                        )}
                      </div>

                      {width > 70 && (
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCopiedShift?.(shift)
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isDraft ? c.bg : "hsl(var(--background))",
                            cursor: "pointer",
                            padding: "0 4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                          }}
                          title="Copy Shift"
                          aria-label="Copy shift"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                      {onDeleteShift && (
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setShiftToDeleteConfirm(shift)
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isDraft ? c.bg : "hsl(var(--background))",
                            cursor: "pointer",
                            padding: "0 4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                          }}
                          title="Delete shift"
                          aria-label="Delete shift"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      {showResize && (
                      <div
                        data-scheduler-resize-handle
                        data-resize="right"
                        className={cn(
                          "transition-opacity duration-150",
                          !isTouchDevice && "opacity-0 group-hover/block:opacity-100"
                        )}
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRRD(e, shift)}
                        style={{
                          width: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : 9,
                          minWidth: isTouchDevice ? RESIZE_HANDLE_MIN_TOUCH_PX : undefined,
                          height: "100%",
                          cursor: "ew-resize",
                          flexShrink: 0,
                          background: isDraft ? `${c.bg}22` : "hsl(var(--foreground))",
                          borderRadius: "0 4px 4px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}>
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: 2,
                                height: 2,
                                borderRadius: "50%",
                                background: isDraft ? c.bg : "hsl(var(--background))",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      )}
                        </>
                      )}
                    </div>
                  )
                })
              })
            })}

            {!isLoading &&
              !readOnly &&
              CATEGORIES.filter(
                (cat) =>
                  !collapsed.has(cat.id) &&
                  displayShifts.filter((s) => s.categoryId === cat.id).length === 0
              ).map((cat) => {
                const top = categoryTops[cat.id] + ROLE_HDR
                const rowH = categoryHeights[cat.id] - ROLE_HDR
                const centerDate = dates[Math.floor(dates.length / 2)] ?? dates[0]
                return (
                  <div
                    key={`empty-row-${cat.id}`}
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
              onDragStaff={(empId: string, categoryId: string) => {
                setDragEmpId(empId)
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
              background: "hsl(var(--background))",
              borderRadius: 12,
              padding: 20,
              maxWidth: 340,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              border: "1px solid hsl(var(--border))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "hsl(var(--foreground))" }}>
              Delete shift?
            </div>
            <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginBottom: 16 }}>
              This shift will be removed. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShiftToDeleteConfirm(null)}
                style={{
                  padding: "8px 16px",
                  background: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
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
                  background: "hsl(var(--destructive))",
                  color: "hsl(var(--destructive-foreground))",
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
          employeeId={undefined}
          prefillStartH={addPrompt.hour}
          onAdd={(shift) => setShifts((prev) => [...prev, shift])}
          onClose={() => setAddPrompt(null)}
        />
      )}
    </div>
  )
}

export const GridView = React.memo(GridViewInner)
