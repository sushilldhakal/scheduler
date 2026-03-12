import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import type { Shift, Category, Employee } from "../types"
import { useSchedulerContext } from "../context"
import {
  HOUR_W,
  SNAP,
  SIDEBAR_W,
  SHIFT_H,
  ROLE_HDR,
  HOUR_HDR_H,
  HOURS,
  DOW_MON_FIRST,
  snapH,
  clamp,
  sameDay,
  isToday,
  fmt12,
  hourBg,
} from "../constants"
import { packShifts, getCategoryRowHeight } from "../utils/packing"
import { StaffPanel } from "./StaffPanel"
import { RoleWarningModal } from "./modals/RoleWarningModal"
import { AddShiftModal } from "./modals/AddShiftModal"
import { Plus } from "lucide-react"

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
}: GridViewProps): JSX.Element {
  const { categories, employees, nextUid, getColor, labels, settings } = useSchedulerContext()
  const CATEGORIES = categories
  const ALL_EMPLOYEES = employees

  const scrollRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const initRef = useRef<boolean>(false)

  const [staffPanel, setStaffPanel] = useState<StaffPanelState | null>(null)
  const [dragEmpId, setDragEmpId] = useState<string | null>(null)
  const [dropHover, setDropHover] = useState<DropHoverState | null>(null)
  const [categoryWarn, setCategoryWarn] = useState<CategoryWarnState | null>(null)
  const [addPrompt, setAddPrompt] = useState<AddPromptState | null>(null)

  const COL_W_WEEK = useMemo((): number => {
    if (!isWeekView) return HOUR_W
    const vh = settings.visibleTo - settings.visibleFrom
    return Math.max(vh * 14, 130)
  }, [isWeekView, settings])

  const PX_WEEK = isWeekView ? COL_W_WEEK / Math.max(settings.visibleTo - settings.visibleFrom, 1) : 1
  const TOTAL_W = isWeekView ? dates.length * COL_W_WEEK : HOURS.length * HOUR_W

  useEffect(() => {
    if (!initRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = isWeekView
        ? 7 * COL_W_WEEK
        : Math.max(0, settings.visibleFrom - 0.5) * HOUR_W
      initRef.current = true
    }
  }, [isWeekView, COL_W_WEEK, settings.visibleFrom])

  const onWeekScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      if (!isWeekView || !setDate) return
      const el = e.currentTarget
      if (el.scrollLeft < COL_W_WEEK * 3) {
        setDate((d) => {
          const nd = new Date(d)
          nd.setDate(nd.getDate() - 7)
          return nd
        })
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollLeft += 7 * COL_W_WEEK
        })
      } else if (el.scrollLeft > TOTAL_W - COL_W_WEEK * 10) {
        setDate((d) => {
          const nd = new Date(d)
          nd.setDate(nd.getDate() + 7)
          return nd
        })
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollLeft -= 7 * COL_W_WEEK
        })
      }
      if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft
      if (sidebarRef.current) sidebarRef.current.scrollTop = el.scrollTop
    },
    [isWeekView, setDate, COL_W_WEEK, TOTAL_W]
  )

  const onDayScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      if (isWeekView) return
      if (sidebarRef.current) sidebarRef.current.scrollTop = e.currentTarget.scrollTop
    },
    [isWeekView]
  )

  const categoryHeights = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}
    CATEGORIES.forEach((cat) => {
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
  }, [shifts, dates, selEmps, CATEGORIES])

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
    const r = gridRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return {
      x: cx - r.left + (scrollRef.current?.scrollLeft ?? 0),
      y: cy - r.top + (scrollRef.current?.scrollTop ?? 0),
    }
  }, [])

  const getCategoryAtY = useCallback(
    (y: number): Category => {
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
      return snapH(clamp(x / HOUR_W, 0, 24))
    },
    [isWeekView, COL_W_WEEK, PX_WEEK, settings.visibleFrom]
  )

  const getDateIdx = useCallback(
    (x: number): number => {
      if (!isWeekView) return 0
      return clamp(Math.floor(x / COL_W_WEEK), 0, dates.length - 1)
    },
    [isWeekView, COL_W_WEEK, dates.length]
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

  const onPM = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!ds.current) return
      const d = ds.current
      const { x, y } = getGridXY(e.clientX, e.clientY)
      const newCat = getCategoryAtY(y)
      const di = getDateIdx(x)

      if (d.type === "move") {
        const dx = x - d.sx
        const di0 = isWeekView ? getDateIdx(d.sx) : 0
        const di1 = getDateIdx(x)
        const dayDelta = di1 - di0
        const hourOffset = isWeekView
          ? snapH((dx - dayDelta * COL_W_WEEK) / PX_WEEK)
          : snapH(dx / HOUR_W)
        const ns = snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
        setGhost({ ns, ne: ns + d.dur, categoryId: newCat.id, dayDelta, id: d.id })
      } else if (d.type === "resize-right") {
        const ne = snapH(
          clamp(d.endH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), d.startH + SNAP, 24)
        )
        setGhost({ ns: d.startH, ne, categoryId: d.categoryId, dayDelta: 0, id: d.id })
      } else {
        const ns = snapH(
          clamp(d.startH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), 0, d.endH - SNAP)
        )
        setGhost({ ns, ne: d.endH, categoryId: d.categoryId, dayDelta: 0, id: d.id })
      }
    },
    [getGridXY, getCategoryAtY, getDateIdx, isWeekView, COL_W_WEEK, PX_WEEK]
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
            const di0 = isWeekView ? getDateIdx(d.sx) : 0
            const di1 = getDateIdx(x)
            const dayDelta = di1 - di0
            const hourOffset = isWeekView
              ? snapH(((x - d.sx) - dayDelta * COL_W_WEEK) / PX_WEEK)
              : snapH((x - d.sx) / HOUR_W)
            const ns = snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
            const origDateIdx = dates.findIndex((dt) => sameDay(dt, s.date))
            const newDateIdx = clamp(origDateIdx + dayDelta, 0, dates.length - 1)
            const newDate = isWeekView ? new Date(dates[newDateIdx]) : s.date

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
      COL_W_WEEK,
      PX_WEEK,
      dates,
      setShifts,
      ALL_EMPLOYEES,
    ]
  )

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
      {isWeekView && (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            borderBottom: "2px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              width: SIDEBAR_W,
              flexShrink: 0,
              borderRight: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "flex-end",
              padding: "0 12px 6px",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {labels.roles}
            </span>
          </div>
          <div ref={headerRef} style={{ flex: 1, overflowX: "hidden" }}>
            <div style={{ display: "flex", width: TOTAL_W }}>
              {dates.map((d, i) => {
                const today = isToday(d)
                const closed = settings.workingHours[d.getDay()] === null
                return (
                  <div
                    key={i}
                    style={{
                      width: COL_W_WEEK,
                      flexShrink: 0,
                      textAlign: "center",
                      padding: "8px 4px 6px",
                      borderRight: "1px solid #e5e7eb",
                      background: today ? "#eff6ff" : closed ? "#f9f9f9" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: today ? "#3b82f6" : closed ? "#d1d5db" : "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {DOW_MON_FIRST[(d.getDay() + 6) % 7]}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: today ? "#fff" : closed ? "#d1d5db" : "#111",
                        background: today ? "#3b82f6" : "transparent",
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
                    {closed && (
                      <div style={{ fontSize: 8, color: "#d1d5db", fontWeight: 600, marginTop: 1 }}>
                        CLOSED
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div
          ref={sidebarRef}
          style={{
            width: SIDEBAR_W,
            flexShrink: 0,
            borderRight: "1px solid #e5e7eb",
            overflowY: "hidden",
            background: "#f9fafb",
          }}
        >
          {!isWeekView && (
            <div
              style={{
                height: HOUR_HDR_H,
                borderBottom: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            />
          )}
          {CATEGORIES.map((cat) => {
            const c = getColor(cat.colorIdx)
            const h = categoryHeights[cat.id]
            const dayShifts0 = shifts.filter(
              (s) => sameDay(s.date, dates[0]) && selEmps.has(s.employeeId)
            )
            const scheduled = dayShifts0.filter((s) => s.categoryId === cat.id).length
            return (
              <div
                key={cat.id}
                style={{
                  height: h,
                  borderBottom: "1px solid #e9ecef",
                  background: "#f0f2f5",
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
                      color: "#374151",
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
            )
          })}
        </div>

        <div
          ref={scrollRef}
          onScroll={isWeekView ? onWeekScroll : onDayScroll}
          style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
        >
          {!isWeekView && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 12,
                display: "flex",
                width: HOURS.length * HOUR_W,
                height: HOUR_HDR_H,
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                flexShrink: 0,
              }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    width: HOUR_W,
                    flexShrink: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "0 0 6px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRight: "1px solid #eee",
                    background: hourBg(h, settings, dates[0].getDay()),
                    color:
                      h >= settings.visibleFrom && h < settings.visibleTo
                        ? h === Math.floor(nowH)
                          ? "#3b82f6"
                          : "#6b7280"
                        : "#c0c0c0",
                  }}
                >
                  {fmt12(h)}
                </div>
              ))}
            </div>
          )}

          <div
            ref={gridRef}
            style={{
              position: "relative",
              width: TOTAL_W,
              height: totalH,
              minHeight: "100%",
            }}
            onPointerMove={onPM}
            onPointerUp={onPU}
            onPointerLeave={onPU}
          >
            {CATEGORIES.map((cat) => {
              const top = categoryTops[cat.id]
              const rowH = categoryHeights[cat.id]
              return dates.map((date, di) => {
                const closed = settings.workingHours[date.getDay()] === null
                const today = isToday(date)
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
                        background: today ? "#f7faff" : closed ? "#f9f9f9" : "#fafafa",
                        borderRight: "1px solid #f0f0f0",
                        borderBottom: "1px solid #ebebeb",
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
                        (_, k) => (
                          <div
                            key={k}
                            style={{
                              position: "absolute",
                              left: k * PX_WEEK,
                              top: 0,
                              width: 1,
                              height: "100%",
                              background: k % 2 === 0 ? "#e8e8e8" : "#f3f3f3",
                              pointerEvents: "none",
                            }}
                          />
                        )
                      )}
                    </div>
                  )
                }
                return HOURS.map((h) => (
                  <div
                    key={`bg-${cat.id}-${h}`}
                    style={{
                      position: "absolute",
                      left: h * HOUR_W,
                      top,
                      width: HOUR_W,
                      height: rowH,
                      background: hourBg(h, settings, date.getDay()),
                      borderRight: "1px solid #ebebeb",
                    }}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                      e.preventDefault()
                      setDropHover({ categoryId: cat.id, hour: h })
                    }}
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => onCellDrop(e, cat.id, 0, h)}
                  />
                ))
              })
            })}

            {CATEGORIES.map((cat) => (
              <div
                key={`sep-${cat.id}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: categoryTops[cat.id] + categoryHeights[cat.id] - 1,
                  width: TOTAL_W,
                  height: 2,
                  background: "#e5e7eb",
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              />
            ))}

            {!isWeekView &&
              HOURS.map((h) => (
                <div
                  key={`vl-${h}`}
                  style={{
                    position: "absolute",
                    left: h * HOUR_W,
                    top: 0,
                    width: 1,
                    height: totalH,
                    background: "#e8e8e8",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
              ))}

            {dates.map((d, di) =>
              isToday(d) ? (
                <div
                  key={`now-${di}`}
                  style={{
                    position: "absolute",
                    left: isWeekView
                      ? di * COL_W_WEEK + (nowH - settings.visibleFrom) * PX_WEEK
                      : nowH * HOUR_W,
                    top: 0,
                    height: totalH,
                    width: 2,
                    background: "#ef4444",
                    zIndex: 15,
                    pointerEvents: "none",
                    boxShadow: "0 0 8px rgba(239,68,68,0.35)",
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
                      background: "#ef4444",
                    }}
                  />
                </div>
              ) : null
            )}

            {CATEGORIES.map((cat) => {
              const top = categoryTops[cat.id]
              const rowH = categoryHeights[cat.id]
              if (isWeekView) {
                return dates.map((date, di) => (
                  <button
                    key={`add-${cat.id}-${di}`}
                    onClick={() =>
                      setAddPrompt({ date, categoryId: cat.id, hour: settings.visibleFrom })
                    }
                    style={{
                      position: "absolute",
                      left: di * COL_W_WEEK + COL_W_WEEK / 2 - 10,
                      top: top + rowH / 2 - 10,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "1.5px dashed #c8d0dc",
                      background: "rgba(255,255,255,0.95)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#a0aab8",
                      zIndex: 4,
                      padding: 0,
                    }}
                  >
                    <Plus size={9} />
                  </button>
                ))
              }
              return HOURS.filter((h) => h >= settings.visibleFrom && h < settings.visibleTo).map(
                (h) => (
                  <button
                    key={`add-${cat.id}-${h}`}
                    onClick={() =>
                      setAddPrompt({ date: dates[0], categoryId: cat.id, hour: h })
                    }
                    style={{
                      position: "absolute",
                      left: h * HOUR_W + HOUR_W / 2 - 9,
                      top: top + ROLE_HDR + 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "1.5px dashed #d1d5db",
                      background: "rgba(255,255,255,0.9)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#b0b8c4",
                      zIndex: 4,
                      padding: 0,
                      opacity: 0.7,
                    }}
                  >
                    <Plus size={8} />
                  </button>
                )
              )
            })}

            {dropHover &&
              dragEmpId &&
              (() => {
                const cat = CATEGORIES.find((c) => c.id === dropHover.categoryId)
                if (!cat) return null
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
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: (dropHover.hour ?? 0) * HOUR_W,
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
                if (!cat) return null
                const c = getColor(cat.colorIdx)
                const top = categoryTops[cat.id]
                let left: number, width: number
                if (isWeekView) {
                  const origDi = dates.findIndex((d) => sameDay(d, orig.date))
                  const newDi = clamp(origDi + (ghost.dayDelta ?? 0), 0, dates.length - 1)
                  left = newDi * COL_W_WEEK + (ghost.ns - settings.visibleFrom) * PX_WEEK
                  width = Math.max((ghost.ne - ghost.ns) * PX_WEEK - 2, 8)
                } else {
                  left = ghost.ns * HOUR_W + 2
                  width = Math.max((ghost.ne - ghost.ns) * HOUR_W - 4, 10)
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
                        background: "rgba(255,255,255,0.9)",
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

                  let left: number, width: number
                  if (isWeekView) {
                    const cs = Math.max(shift.startH, settings.visibleFrom)
                    const ce = Math.min(shift.endH, settings.visibleTo)
                    if (ce <= cs) return null
                    left = di * COL_W_WEEK + (cs - settings.visibleFrom) * PX_WEEK + 1
                    width = Math.max((ce - cs) * PX_WEEK - 2, 12)
                  } else {
                    left = shift.startH * HOUR_W + 2
                    width = Math.max((shift.endH - shift.startH) * HOUR_W - 4, 18)
                  }

                  return (
                    <div
                      key={shift.id}
                      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onBD(e, shift)}
                      onClick={() => {
                        if (!dragId) onShiftClick(shift, cat)
                      }}
                      style={{
                        position: "absolute",
                        left,
                        top,
                        width,
                        height: SHIFT_H - 6,
                        borderRadius: 5,
                        cursor: isDrag ? "grabbing" : "grab",
                        userSelect: "none",
                        touchAction: "none",
                        opacity: isDrag ? 0.3 : 1,
                        background: isDraft
                          ? "transparent"
                          : `linear-gradient(135deg,${c.bg},${c.bg}cc)`,
                        border: isDraft ? `1.5px dashed ${c.bg}` : `1px solid ${c.bg}88`,
                        boxShadow: isDrag || isDraft ? "none" : `0 2px 6px ${c.bg}44`,
                        zIndex: isDrag ? 20 : 8,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        data-resize="left"
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRLD(e, shift)}
                        style={{
                          width: 9,
                          height: "100%",
                          cursor: "ew-resize",
                          flexShrink: 0,
                          background: isDraft ? `${c.bg}22` : "rgba(0,0,0,0.13)",
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
                                background: isDraft ? c.bg : "rgba(255,255,255,0.65)",
                              }}
                            />
                          ))}
                        </div>
                      </div>

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
                              color: isDraft ? c.bg : "#fff",
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
                                  color: "#fff",
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
                              color: isDraft ? c.text : "rgba(255,255,255,0.8)",
                              fontSize: 9,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt12(shift.startH)}–{fmt12(shift.endH)}
                          </div>
                        )}
                      </div>

                      <div
                        data-resize="right"
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRRD(e, shift)}
                        style={{
                          width: 9,
                          height: "100%",
                          cursor: "ew-resize",
                          flexShrink: 0,
                          background: isDraft ? `${c.bg}22` : "rgba(0,0,0,0.13)",
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
                                background: isDraft ? c.bg : "rgba(255,255,255,0.65)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              })
            })}
          </div>
        </div>
      </div>

      {staffPanel &&
        (() => {
          const cat = CATEGORIES.find((c) => c.id === staffPanel.categoryId)
          const date = dates[isWeekView ? Math.floor(dates.length / 2) : 0]
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
