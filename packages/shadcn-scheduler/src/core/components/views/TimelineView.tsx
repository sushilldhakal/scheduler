import React, { useMemo, useRef, useCallback, useState, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Block, Resource } from "../../types"
import type { DragCommit } from "../../layout/dragEngine"
import { useSchedulerContext } from "../../context"
import {
  SIDEBAR_W,
  ROLE_HDR,
  SHIFT_H,
  HOUR_HDR_H,
  sameDay,
  isToday,
  fmt12,
  hourBg,
  isOutsideWorkingHours,
  DASHED_BG,
  toDateISO,
} from "../../constants"
import { packShifts } from "../../utils/packing"
import { useDragEngine } from "../../hooks/useDragEngine"

interface TimelineViewProps {
  date: Date
  dates?: Date[]
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  zoom?: number
}

const HOUR_W = 88

function TimelineViewInner({
  date,
  dates: datesProp,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  zoom = 1,
}: TimelineViewProps): React.ReactElement {
  const { categories, employees, getColor, settings, slots, labels, snapMinutes } = useSchedulerContext()

  // ── Date array ────────────────────────────────────────────────────────────
  const dates = useMemo(
    () => (datesProp && datesProp.length > 0 ? datesProp : [date]),
    [datesProp, date]
  )
  const isMultiDay = dates.length > 1

  // ── Scroll sync ───────────────────────────────────────────────────────────
  const headerScrollRef  = useRef<HTMLDivElement>(null)
  const gridScrollRef    = useRef<HTMLDivElement>(null)
  // FIX #3: sidebar uses overflow-y-hidden — virtualizer handles layout via
  // absolute positioning, so we don't need scrollTop sync. We only need the
  // ref so the sidebar inner div mirrors the same height as the grid content.
  const sidebarInnerRef  = useRef<HTMLDivElement>(null)
  const syncingRef       = useRef(false)

  const onGridScroll = useCallback(() => {
    if (syncingRef.current) return
    syncingRef.current = true
    const grid = gridScrollRef.current
    // Sync horizontal header scroll only
    if (headerScrollRef.current && grid) headerScrollRef.current.scrollLeft = grid.scrollLeft
    // Sidebar vertical: move inner div by negating scrollTop so it tracks grid
    if (sidebarInnerRef.current && grid) {
      sidebarInnerRef.current.style.transform = `translateY(-${grid.scrollTop}px)`
    }
    syncingRef.current = false
  }, [])

  // ── Drag ghost refs ───────────────────────────────────────────────────────
  const ghostRef       = useRef<HTMLDivElement | null>(null)
  const cursorGhostRef = useRef<HTMLDivElement | null>(null)

  // ── Edge scroll ───────────────────────────────────────────────────────────
  const edgeScrollRef = useRef<{ dirX: number; speedX: number; dirY: number; speedY: number } | null>(null)
  const edgeRafRef    = useRef<number | null>(null)
  const EDGE_SCROLL_ZONE = 80
  const EDGE_SCROLL_MAX  = 20

  const stopEdgeScroll = useCallback(() => {
    if (edgeRafRef.current !== null) { cancelAnimationFrame(edgeRafRef.current); edgeRafRef.current = null }
    edgeScrollRef.current = null
  }, [])

  const startEdgeScroll = useCallback((dirX: number, speedX: number, dirY: number, speedY: number) => {
    edgeScrollRef.current = { dirX, speedX, dirY, speedY }
    if (edgeRafRef.current !== null) return
    const tick = () => {
      const s = edgeScrollRef.current
      if (!s || !gridScrollRef.current) { stopEdgeScroll(); return }
      if (s.dirX !== 0) {
        gridScrollRef.current.scrollLeft += s.dirX * s.speedX * EDGE_SCROLL_MAX
        if (headerScrollRef.current) headerScrollRef.current.scrollLeft = gridScrollRef.current.scrollLeft
      }
      if (s.dirY !== 0) gridScrollRef.current.scrollTop += s.dirY * s.speedY * EDGE_SCROLL_MAX
      edgeRafRef.current = requestAnimationFrame(tick)
    }
    edgeRafRef.current = requestAnimationFrame(tick)
  }, [stopEdgeScroll])

  // ── Now-line ──────────────────────────────────────────────────────────────
  const [nowH, setNowH] = useState(() => new Date().getHours() + new Date().getMinutes() / 60)
  useEffect(() => {
    const t = setInterval(() => { const d = new Date(); setNowH(d.getHours() + d.getMinutes() / 60) }, 60000)
    return () => clearInterval(t)
  }, [])

  // ── Dimensions ────────────────────────────────────────────────────────────
  const hourWidth    = HOUR_W * zoom
  const visibleHours = settings.visibleTo - settings.visibleFrom
  const dayWidth     = visibleHours * hourWidth
  const gridWidth    = dates.length * dayWidth

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  const filteredEmployees = useMemo(
    () => employees.filter((e) => selEmps.has(e.id)),
    [employees, selEmps]
  )

  const shiftsByEmployee = useMemo(() => {
    const dateISOs = new Set(dates.map((d) => toDateISO(d)))
    const map: Record<string, Block[]> = {}
    filteredEmployees.forEach((emp) => {
      map[emp.id] = shifts
        .filter((s) => s.employeeId === emp.id && selEmps.has(s.employeeId) && dateISOs.has(s.date))
        .sort((a, b) => a.startH - b.startH)
    })
    return map
  }, [shifts, dates, filteredEmployees, selEmps])

  const rowHeights = useMemo(() => {
    const map: Record<string, number> = {}
    filteredEmployees.forEach((emp) => {
      const list = shiftsByEmployee[emp.id] ?? []
      if (list.length === 0) { map[emp.id] = ROLE_HDR + SHIFT_H; return }
      const lanes     = packShifts(list)
      const laneCount = Math.max(1, ...lanes.map((l) => l + 1))
      map[emp.id] = ROLE_HDR + laneCount * SHIFT_H
    })
    return map
  }, [filteredEmployees, shiftsByEmployee])

  // ── Virtualizer ───────────────────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count:            filteredEmployees.length,
    getScrollElement: () => gridScrollRef.current,
    estimateSize:     (i) => rowHeights[filteredEmployees[i]?.id ?? ""] ?? (ROLE_HDR + SHIFT_H),
    overscan:         6,
  })

  // FIX #2 + #5: vrTopsRef is a stable ref updated every render from vr.start
  // values. categoryTops memo falls back to accumulated heights for off-screen
  // rows not currently in getVirtualItems(). This mirrors the GridView pattern
  // and ensures the drag engine has accurate Y positions for ALL rows.
  const vrTopsRef = useRef<Record<string, number>>({})

  const categoryTops = useMemo((): Record<string, number> => {
    // If vrTopsRef is fully populated (all rows have been rendered at least once),
    // use it directly — it has the most up-to-date vr.start values.
    if (Object.keys(vrTopsRef.current).length >= filteredEmployees.length) {
      return { ...vrTopsRef.current }
    }
    // Fallback: accumulate heights for rows not yet seen by virtualizer
    const map: Record<string, number> = {}
    let acc = 0
    filteredEmployees.forEach((emp) => {
      map[emp.id] = vrTopsRef.current[emp.id] ?? acc
      acc += rowHeights[emp.id] ?? (ROLE_HDR + SHIFT_H)
    })
    return map
  }, [filteredEmployees, rowHeights])

  const categoryHeights = useMemo(() => {
    const map: Record<string, number> = {}
    filteredEmployees.forEach((emp) => { map[emp.id] = rowHeights[emp.id] ?? (ROLE_HDR + SHIFT_H) })
    return map
  }, [filteredEmployees, rowHeights])

  // ── Row highlight ─────────────────────────────────────────────────────────
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  // ── Drag commit ───────────────────────────────────────────────────────────
  const onCommit = useCallback((patch: DragCommit, currentShifts: Block[]) => {
    setShifts(currentShifts.map((s) =>
      s.id !== patch.id ? s : { ...s, startH: patch.startH, endH: patch.endH, date: patch.date, categoryId: patch.categoryId }
    ))
  }, [setShifts])

  // ── Drag engine ───────────────────────────────────────────────────────────
  const snapHours = (snapMinutes ?? 30) / 60
  const { dragId, startMove, startResizeLeft, startResizeRight } = useDragEngine(
    gridScrollRef, ghostRef, cursorGhostRef,
    categories, categoryTops, categoryHeights,
    dates, settings, zoom,
    false, isMultiDay, snapHours, false,
    onCommit, setHoveredRowId, shifts,
  )

  // ── Hour labels ───────────────────────────────────────────────────────────
  const hourLabels = useMemo(() => {
    const out: number[] = []
    for (let h = settings.visibleFrom; h < settings.visibleTo; h++) out.push(h)
    return out
  }, [settings.visibleFrom, settings.visibleTo])

  // ── Edge scroll on pointer move ───────────────────────────────────────────
  const onGridPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragId) { stopEdgeScroll(); return }
    const el = gridScrollRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    const vw = rect.width,            vh = rect.height
    let dirX = 0, speedX = 0, dirY = 0, speedY = 0
    if (px < EDGE_SCROLL_ZONE && px >= 0)            { dirX = -1; speedX = Math.max(0.1, 1 - px / EDGE_SCROLL_ZONE) }
    else if (px > vw - EDGE_SCROLL_ZONE && px <= vw) { dirX =  1; speedX = Math.max(0.1, 1 - (vw - px) / EDGE_SCROLL_ZONE) }
    if (py < EDGE_SCROLL_ZONE && py >= 0)            { dirY = -1; speedY = Math.max(0.1, 1 - py / EDGE_SCROLL_ZONE) }
    else if (py > vh - EDGE_SCROLL_ZONE && py <= vh) { dirY =  1; speedY = Math.max(0.1, 1 - (vh - py) / EDGE_SCROLL_ZONE) }
    if (dirX !== 0 || dirY !== 0) startEdgeScroll(dirX, speedX, dirY, speedY)
    else stopEdgeScroll()
  }, [dragId, startEdgeScroll, stopEdgeScroll])

  const onGridPointerUp = useCallback(() => stopEdgeScroll(), [stopEdgeScroll])

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex shrink-0 border-b-2 border-border bg-muted" style={{ height: HOUR_HDR_H }}>
        <div className="flex shrink-0 items-end border-r border-border px-3 pb-1.5" style={{ width: SIDEBAR_W }}>
          {/* FIX #1: labels.category from context — no hardcoded string */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {labels.category ?? "Resource"}
          </span>
        </div>
        <div
          ref={headerScrollRef}
          className="min-w-0 flex-1 overflow-hidden"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          <div style={{ width: gridWidth, display: "flex" }}>
            {dates.map((d, di) => (
              <div key={di} style={{ width: dayWidth, flexShrink: 0 }}>
                {isMultiDay && (
                  <div
                    className="border-b border-border px-2 text-[10px] font-semibold"
                    style={{
                      height: 18, lineHeight: "18px",
                      borderLeft: di > 0 ? "1px solid var(--border)" : undefined,
                      color: isToday(d) ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                )}
                <div className="flex" style={{ height: isMultiDay ? HOUR_HDR_H - 18 : HOUR_HDR_H }}>
                  {hourLabels.map((h) => (
                    <div
                      key={h}
                      className="flex shrink-0 items-end justify-center pb-1 text-[10px] font-medium"
                      style={{
                        width: hourWidth,
                        color: isToday(d) && h === Math.floor(nowH) ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    >
                      {fmt12(h)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────
            FIX #3: overflow-y-hidden is correct — the virtualizer manages
            layout via absolute positioning so no scrollTop needed. Instead
            we translate the inner div in onGridScroll to keep rows aligned. */}
        <div
          className="shrink-0 overflow-hidden border-r border-border"
          style={{ width: SIDEBAR_W }}
        >
          <div
            ref={sidebarInnerRef}
            style={{ position: "relative", height: rowVirtualizer.getTotalSize(), willChange: "transform" }}
          >
            {rowVirtualizer.getVirtualItems().map((vr) => {
              const emp = filteredEmployees[vr.index]
              if (!emp) return null
              const empShifts = shiftsByEmployee[emp.id] ?? []
              return (
                <div
                  key={emp.id}
                  className="absolute left-0 right-0 flex items-center border-b border-border bg-muted/50 px-2"
                  style={{ top: vr.start, height: vr.size }}
                >
                  {slots.resourceHeader
                    ? slots.resourceHeader({ resource: emp, scheduledCount: empShifts.length, isCollapsed: false, onToggleCollapse: () => {} })
                    : <span className="truncate text-xs font-medium text-foreground">{emp.name}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Grid ── */}
        <div
          ref={gridScrollRef}
          className="relative min-w-0 flex-1 overflow-auto"
          onScroll={onGridScroll}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
          onPointerCancel={onGridPointerUp}
        >
          {/* Ghost divs for drag engine */}
          <div
            ref={ghostRef}
            data-scheduler-ghost
            style={{ display: "none", position: "absolute", pointerEvents: "none", zIndex: 18, borderRadius: 6 }}
          >
            <span data-ghost-label style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }} />
          </div>
          <div
            ref={cursorGhostRef}
            data-scheduler-cursor-ghost
            style={{ display: "none", position: "absolute", pointerEvents: "none", zIndex: 100, borderRadius: 6, willChange: "transform" }}
          />

          {/* Virtual content */}
          <div style={{ position: "relative", width: gridWidth, height: rowVirtualizer.getTotalSize() }}>

            {/* Now-line */}
            {dates.map((d, di) =>
              isToday(d) && nowH >= settings.visibleFrom && nowH < settings.visibleTo ? (
                <div
                  key={`now-${di}`}
                  data-scheduler-now-line
                  className="pointer-events-none absolute top-0 z-20 w-0.5 bg-destructive/80 shadow-[0_0_6px_var(--destructive)/0.4]"
                  style={{ left: di * dayWidth + (nowH - settings.visibleFrom) * hourWidth, height: rowVirtualizer.getTotalSize() }}
                >
                  <div className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full border border-border bg-destructive/90" />
                </div>
              ) : null
            )}

            {/* Rows */}
            {rowVirtualizer.getVirtualItems().map((vr) => {
              const emp = filteredEmployees[vr.index]
              if (!emp) return null

              // FIX #2 + #5: Update vrTopsRef with actual vr.start on every render.
              // This is read by the categoryTops memo so the drag engine always has
              // accurate Y coords — even for rows that were off-screen on first render.
              vrTopsRef.current[emp.id] = vr.start

              const empShifts = shiftsByEmployee[emp.id] ?? []
              const lanes     = packShifts(empShifts)
              const cat0      = categoryMap[emp.categoryId ?? ""]
              const isHovered = hoveredRowId === emp.id
              const rowBg     = isHovered && cat0 ? `${getColor(cat0.colorIdx).bg}18` : undefined

              return (
                <div
                  key={emp.id}
                  className="absolute left-0 border-b border-border"
                  style={{ top: vr.start, height: vr.size, width: gridWidth, background: rowBg }}
                >
                  {/* Hour backgrounds */}
                  {dates.map((d, di) => {
                    const dow = d.getDay()
                    return hourLabels.map((h) => (
                      <div
                        key={`${di}-${h}`}
                        className="absolute bottom-0 top-0 border-r border-border"
                        style={{
                          left: di * dayWidth + (h - settings.visibleFrom) * hourWidth,
                          width: hourWidth,
                          background: isOutsideWorkingHours(h, settings, dow) ? DASHED_BG : hourBg(h, settings, dow),
                        }}
                      />
                    ))
                  })}

                  {/* Click-to-create overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ zIndex: 1 }}
                    onPointerDown={(e) => {
                      if ((e.target as HTMLElement).closest("[data-scheduler-block]")) return
                      const rect = gridScrollRef.current?.getBoundingClientRect()
                      if (!rect) return
                      const x  = (gridScrollRef.current?.scrollLeft ?? 0) + e.clientX - rect.left
                      const di = Math.min(Math.floor(x / dayWidth), dates.length - 1)
                      const clickDate = dates[Math.max(0, di)] ?? dates[0]!
                      if (clickDate) onAddShift(clickDate, emp.categoryId, emp.id)
                    }}
                  />

                  {/* Blocks */}
                  {empShifts.map((shift, i) => {
                    const cat = categoryMap[shift.categoryId]
                    if (!cat) return null
                    const c        = getColor(cat.colorIdx)
                    const lane     = lanes[i] ?? 0
                    const dayIndex = dates.findIndex((d) => sameDay(d, shift.date))
                    if (dayIndex < 0) return null
                    const left     = dayIndex * dayWidth + (shift.startH - settings.visibleFrom) * hourWidth
                    const w        = (shift.endH - shift.startH) * hourWidth
                    const top      = ROLE_HDR + lane * SHIFT_H + 2
                    const height   = SHIFT_H - 4
                    const isDraft  = shift.status === "draft"
                    const widthPx  = Math.max(w, 24)
                    // FIX #4: use sameDay pattern matching GridView instead of fragile Date constructor
                    const isLive     = sameDay(shift.date, new Date()) && nowH >= shift.startH && nowH < shift.endH
                    const isDragging = dragId === shift.id

                    if (slots.block) {
                      return (
                        <div key={shift.id} data-scheduler-block className="absolute" style={{ left, top, width: widthPx, height, zIndex: 2 }}>
                          {slots.block({ block: shift, resource: cat, isDraft, isDragging, hasConflict: false, widthPx, onDoubleClick: () => onShiftClick(shift, cat) })}
                        </div>
                      )
                    }

                    return (
                      <button
                        key={shift.id}
                        type="button"
                        data-scheduler-block
                        className="absolute overflow-hidden rounded-md border text-left text-xs font-medium transition-shadow hover:shadow-md"
                        style={{
                          left, top, width: widthPx, height,
                          zIndex: isDragging ? 50 : 2,
                          opacity: isDragging ? 0.4 : 1,
                          background: isDraft ? c.light : `linear-gradient(135deg,${c.bg},${c.bg}cc)`,
                          color: isDraft ? c.text : "rgba(255,255,255,0.95)",
                          borderColor: isDraft ? c.border : `${c.bg}88`,
                          borderStyle: isDraft ? "dashed" : "solid",
                          boxShadow: isLive ? "0 0 0 2px var(--primary)" : undefined,
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                          startMove(e, shift, e.currentTarget as HTMLElement)
                        }}
                        onClick={(e) => { e.stopPropagation(); if (!dragId) onShiftClick(shift, cat) }}
                      >
                        <div data-resize="left"  className="absolute left-0  top-0 bottom-0 w-2 cursor-ew-resize" style={{ zIndex: 3 }}
                          onPointerDown={(e) => { e.stopPropagation(); startResizeLeft(e, shift) }} />
                        <div data-resize="right" className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize" style={{ zIndex: 3 }}
                          onPointerDown={(e) => { e.stopPropagation(); startResizeRight(e, shift) }} />
                        <span className="block truncate px-1.5 pt-0.5 font-semibold leading-tight">{shift.employee}</span>
                        <span className="block truncate px-1.5 text-[10px] leading-tight" style={{ opacity: 0.8 }}>
                          {fmt12(shift.startH)}–{fmt12(shift.endH)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export const TimelineView = React.memo(TimelineViewInner)
