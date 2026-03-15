import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import type { Shift, Category, Employee } from "../types"
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
  clamp,
  sameDay,
  isToday,
  fmt12,
  hourBg,
  isOutsideWorkingHours,
  DASHED_BG,
  getWeekDates,
} from "../constants"
import { packShifts, getCategoryRowHeight } from "../utils/packing"
import { StaffPanel } from "./StaffPanel"
import { RoleWarningModal } from "./modals/RoleWarningModal"
import { AddShiftModal } from "./modals/AddShiftModal"
import { Plus, Copy, ClipboardPaste, Trash2 } from "lucide-react"

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
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  selEmps: Set<string>
  onShiftClick: (shift: Shift, category: Category) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  isWeekView?: boolean
  setDate?: React.Dispatch<React.SetStateAction<Date>>
  /** Day view with multiple days: [Mon 7-5pm][Tue 7-5pm]... horizontal scroll */
  isDayViewMultiDay?: boolean
  /** The date that should be centered/focused (e.g. from calendar pick) */
  focusedDate?: Date
  copiedShift?: Shift | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Shift | null>>
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
  shift?: Shift
  newCategoryId?: string
  ns?: number
  ne?: number
  newDate?: Date
  empName?: string
  fromCategory?: Category
  toCategory?: Category
  onConfirmAction?: () => void
}

interface AddPromptState {
  date: Date
  categoryId: string
  hour: number
}

export function GridView({
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
}: GridViewProps): JSX.Element {
  const { categories, employees, nextUid, getColor, labels, settings } = useSchedulerContext()
  const CATEGORIES = categories
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
  const [shiftToDeleteConfirm, setShiftToDeleteConfirm] = useState<Shift | null>(null)

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
      onVisibleRangeChange(new Date(dates[firstIdx]), new Date(dates[lastIdx]))
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

  const categoryHeights = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}
    CATEGORIES.forEach((cat) => {
      if (collapsed.has(cat.id)) {
        map[cat.id] = ROLE_HDR
        return
      }
      let maxH = ROLE_HDR + SHIFT_H
      dates.forEach((date) => {
        const dayShifts = shifts.filter(
          (s) => sameDay(s.date, date) && selEmps.has(s.employeeId)
        )
        const h = getCategoryRowHeight(cat.id, dayShifts)
        if (h > maxH) maxH = h
      })
      map[cat.id] = maxH
    })
    return map
  }, [shifts, dates, selEmps, CATEGORIES, collapsed])

  const categoryTops = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}
    let acc = 0
    CATEGORIES.forEach((c) => {
      map[c.id] = acc
      acc += categoryHeights[c.id]
    })
    return map
  }, [categoryHeights, CATEGORIES])

  const totalH = useMemo(
    (): number => CATEGORIES.reduce((s, c) => s + categoryHeights[c.id], 0),
    [categoryHeights, CATEGORIES]
  )

  const ds = useRef<DragState | null>(null)
  const [ghost, setGhost] = useState<GhostState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

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
    (y: number): Category => {
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

  const onBD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
      if ((e.target as HTMLElement).dataset.resize) return
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
    [getGridXY]
  )

  const onRRD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
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
    [getGridXY]
  )

  const onRLD = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
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
    [getGridXY]
  )

  const EDGE_SCROLL_ZONE = 80
  const EDGE_SCROLL_SPEED = 12

  const onPM = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
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
    [getGridXY, getCategoryAtY, getDateIdx, isWeekView, isDayViewMultiDay, COL_W_WEEK, DAY_WIDTH, PX_WEEK, HOUR_W]
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
      ds.current = null
      setDragId(null)
      setGhost(null)

      setShifts((prev) =>
        prev.map((s) => {
          if (s.id !== d.id) return s
          const origEmp = ALL_EMPLOYEES.find((emp) => emp.id === s.employeeId)

          if (d.type === "move") {
            const di0 = isWeekView || isDayViewMultiDay ? getDateIdx(d.sx) : 0
            const di1 = getDateIdx(x)
            const dayDelta = di1 - di0
            // When moving between days, preserve original hours; only apply offset within same day
            const hourOffset =
              dayDelta !== 0
                ? 0
                : isWeekView
                  ? snapH((x - d.sx) / PX_WEEK)
                  : snapH((x - d.sx) / HOUR_W)
            const ns = snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
            const origDateIdx = dates.findIndex((dt) => sameDay(dt, s.date))
            const newDateIdx = clamp(origDateIdx + dayDelta, 0, dates.length - 1)
            const newDate =
              isWeekView || isDayViewMultiDay ? new Date(dates[newDateIdx]) : s.date

            if (newCat.id !== s.categoryId && origEmp && origEmp.categoryId !== newCat.id) {
              setCategoryWarn({ shift: s, newCategoryId: newCat.id, ns, ne: ns + d.dur, newDate })
              return s
            }
            return { ...s, startH: ns, endH: ns + d.dur, categoryId: newCat.id, date: newDate }
          } else if (d.type === "resize-right") {
            const ne = snapH(
              clamp(d.endH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), d.startH + SNAP, 24)
            )
            return { ...s, endH: ne }
          } else {
            const ns = snapH(
              clamp(d.startH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), 0, d.endH - SNAP)
            )
            return { ...s, startH: ns }
          }
        })
      )
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
      setShifts,
      ALL_EMPLOYEES,
    ]
  )

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
    const pu = (e: PointerEvent) => { onPURef.current(e as unknown as React.PointerEvent<HTMLDivElement>) }
    const pc = (e: PointerEvent) => onPCRef.current(e as unknown as React.PointerEvent<HTMLDivElement>)
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
                date,
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
            date,
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

  const nowH = new Date().getHours() + new Date().getMinutes() / 60

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
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
                                    style={{
                                      fontSize: 8,
                                      fontWeight: 600,
                                      color: "hsl(var(--muted-foreground))",
                                      flex: 1,
                                      textAlign: "center",
                                      minWidth: 0,
                                    }}
                                  >
                                    {fmt12(h)}
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
                              {fmt12(h)}
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
                        {fmt12(h)}
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
            let baseShifts: Shift[]
            if (isWeekView) {
              const [weekStartOrig] = getWeekDates(refDate)
              const weekStart = new Date(weekStartOrig)
              weekStart.setHours(0, 0, 0, 0)
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekEnd.getDate() + 6)
              weekEnd.setHours(23, 59, 59, 999)
              baseShifts = shifts.filter(
                (s) =>
                  selEmps.has(s.employeeId) &&
                  s.date >= weekStart &&
                  s.date <= weekEnd
              )
            } else {
              baseShifts = shifts.filter(
                (s) => sameDay(s.date, refDate) && selEmps.has(s.employeeId)
              )
            }
            const isDev =
              (typeof process !== "undefined" && process.env?.NODE_ENV === "development") ||
              (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV)
            if (isDev) {
              const refLabel = refDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
              console.log("[scheduler] category counts", {
                refDate: refLabel,
                isWeekView,
                totalShiftsInRange: baseShifts.length,
                byCategory: CATEGORIES.map((cat) => ({
                  name: cat.name,
                  scheduled: baseShifts.filter((s) => s.categoryId === cat.id).length,
                })),
              })
            }
            return CATEGORIES.map((cat) => {
              const c = getColor(cat.colorIdx)
              const h = categoryHeights[cat.id]
              const scheduled = baseShifts.filter((s) => s.categoryId === cat.id).length
              return (
              <div
                key={cat.id}
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
                style={{
                  position: "relative",
                  width: isWeekView || isDayViewMultiDay ? TOTAL_W : DAY_WIDTH,
                  height: totalH,
                  minHeight: "100%",
                }}
                onPointerMove={onPM}
                onPointerUp={onPU}
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
                  style={{
                    position: "absolute",
                    left: isWeekView
                      ? di * COL_W_WEEK + (nowH - settings.visibleFrom) * PX_WEEK
                      : isDayViewMultiDay
                        ? di * DAY_WIDTH + (nowH - settings.visibleFrom) * HOUR_W
                        : (nowH - settings.visibleFrom) * HOUR_W,
                    top: 0,
                    height: totalH,
                    width: 2,
                    background: "hsl(var(--muted-foreground) / 0.45)",
                    zIndex: 15,
                    pointerEvents: "none",
                    boxShadow: "0 0 4px hsl(var(--muted-foreground) / 0.2)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: -4,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "hsl(var(--muted-foreground) / 0.5)",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
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
                          const newShift: Shift = {
                            ...copiedShift,
                            id: nextUid(),
                            date,
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
                          const newShift: Shift = {
                            ...copiedShift,
                            id: nextUid(),
                            date: dates[1] ?? dates[0],
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
                if (isWeekView)
                  return (
                    <div
                      style={{
                        position: "absolute",
                        left: (dropHover.di ?? 0) * COL_W_WEEK,
                        top,
                        width: COL_W_WEEK,
                        height: rowH,
                        background: `${c.bg}18`,
                        border: `2px dashed ${c.bg}`,
                        borderRadius: 4,
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    />
                  )
                if (isDayViewMultiDay)
                  return (
                    <div
                      style={{
                        position: "absolute",
                        left:
                          (dropHover.di ?? 0) * DAY_WIDTH +
                          ((dropHover.hour ?? settings.visibleFrom) - settings.visibleFrom) * HOUR_W,
                        top,
                        width: HOUR_W * 2,
                        height: rowH,
                        background: `${c.bg}18`,
                        border: `2px dashed ${c.bg}`,
                        borderRadius: 4,
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    />
                  )
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: ((dropHover.hour ?? settings.visibleFrom) - settings.visibleFrom) * HOUR_W,
                      top,
                      width: HOUR_W * 2,
                      height: rowH,
                      background: `${c.bg}18`,
                      border: `2px dashed ${c.bg}`,
                      borderRadius: 4,
                      pointerEvents: "none",
                      zIndex: 10,
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
                  <div
                    style={{
                      position: "absolute",
                      left,
                      top: top + ROLE_HDR + 3,
                      width,
                      height: SHIFT_H - 6,
                      background: c.bg,
                      opacity: 0.2,
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
                )
              })()}

            {CATEGORIES.map((cat) => {
              if (collapsed.has(cat.id)) return null
              const catTop = categoryTops[cat.id]
              return dates.map((date, di) => {
                const dayShifts = shifts.filter(
                  (s) => sameDay(s.date, date) && s.categoryId === cat.id && selEmps.has(s.employeeId)
                )
                const sorted = [...dayShifts].sort((a, b) => a.startH - b.startH)
                const trackNums = packShifts(sorted)
                const c = getColor(cat.colorIdx)

                return sorted.map((shift, si) => {
                  const track = trackNums[si]
                  const isDraft = shift.status === "draft"
                  const isDrag = dragId === shift.id
                  const top = catTop + ROLE_HDR + track * SHIFT_H + 3
                  const variant = settings.badgeVariant ?? "both"
                  const canDrag = variant === "drag" || variant === "both"
                  const showResize = variant === "resize" || variant === "both"

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
                    opacity: isDrag ? 0.3 : 1,
                    zIndex: isDrag ? 20 : 8,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    background: isDraft
                      ? "transparent"
                      : `linear-gradient(135deg,${c.bg},${c.bg}cc)`,
                    border: isDraft ? `1.5px dashed ${c.bg}` : `1px solid ${c.bg}88`,
                    boxShadow: isDrag || isDraft ? "none" : `0 2px 6px ${c.bg}44`,
                  }

                  return (
                    <div
                      key={shift.id}
                      onPointerDown={
                        canDrag
                          ? (e: React.PointerEvent<HTMLDivElement>) => onBD(e, shift)
                          : undefined
                      }
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        if (!dragId) onShiftClick(shift, cat)
                      }}
                      style={blockStyle}
                    >
                      {showResize && (
                      <div
                        data-resize="left"
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRLD(e, shift)}
                        style={{
                          width: 9,
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
                        {width > 28 && (
                          <div
                            style={{
                              color: isDraft ? c.bg : "hsl(var(--background))",
                              fontSize: 10,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
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
                            {width > 60 ? shift.employee.split(" ")[0] : shift.employee[0]}
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
                            {fmt12(shift.startH)}–{fmt12(shift.endH)}
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
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      {showResize && (
                      <div
                        data-resize="right"
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRRD(e, shift)}
                        style={{
                          width: 9,
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
                    </div>
                  )
                })
              })
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
              anchorRect={staffPanel.anchorRect}
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
                  onDeleteShift(shiftToDeleteConfirm.id)
                  setShiftToDeleteConfirm(null)
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
