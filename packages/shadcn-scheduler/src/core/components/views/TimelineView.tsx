import React, { useMemo } from "react"
import type { Block, Resource } from "../../types"
import { useSchedulerContext } from "../../context"
import {
  SIDEBAR_W,
  ROLE_HDR,
  SHIFT_H,
  HOUR_HDR_H,
  sameDay,
  fmt12,
  hourBg,
  isOutsideWorkingHours,
  DASHED_BG,
} from "../../constants"
import { packShifts } from "../../utils/packing"

interface TimelineViewProps {
  date: Date
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
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  zoom = 1,
}: TimelineViewProps): React.ReactElement {
  const { categories, employees, getColor, settings, slots } = useSchedulerContext()
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  const filteredEmployees = useMemo(
    () => employees.filter((e) => selEmps.has(e.id)),
    [employees, selEmps]
  )

  const dayShiftsByEmployee = useMemo(() => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const map: Record<string, Block[]> = {}
    filteredEmployees.forEach((emp) => {
      const empShifts = shifts.filter(
        (s) =>
          sameDay(s.date, date) &&
          s.employeeId === emp.id &&
          selEmps.has(s.employeeId)
      )
      map[emp.id] = [...empShifts].sort((a, b) => a.startH - b.startH)
    })
    return map
  }, [shifts, date, filteredEmployees, selEmps])

  const rowHeights = useMemo(() => {
    const map: Record<string, number> = {}
    filteredEmployees.forEach((emp) => {
      const list = dayShiftsByEmployee[emp.id] ?? []
      if (list.length === 0) {
        map[emp.id] = ROLE_HDR + SHIFT_H
      } else {
        const lanes = packShifts(list)
        const lanesCount = Math.max(1, ...lanes.map((l) => l + 1))
        map[emp.id] = ROLE_HDR + lanesCount * SHIFT_H
      }
    })
    return map
  }, [filteredEmployees, dayShiftsByEmployee])

  const totalContentH = useMemo(
    () =>
      filteredEmployees.reduce((sum, emp) => sum + (rowHeights[emp.id] ?? 0), 0),
    [filteredEmployees, rowHeights]
  )

  const hourWidth = HOUR_W * zoom
  const visibleHours = settings.visibleTo - settings.visibleFrom
  const gridWidth = visibleHours * hourWidth
  const dow = date.getDay()

  const hourLabels = useMemo(() => {
    const out: number[] = []
    for (let h = settings.visibleFrom; h < settings.visibleTo; h++) {
      out.push(h)
    }
    return out
  }, [settings.visibleFrom, settings.visibleTo])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="flex shrink-0 border-b-2 border-border bg-muted"
        style={{ height: HOUR_HDR_H }}
      >
        <div
          className="flex shrink-0 items-end border-r border-border px-3 pb-1.5"
          style={{ width: SIDEBAR_W }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Staff
          </span>
        </div>
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {hourLabels.map((h) => (
            <div
              key={h}
              className="flex shrink-0 items-end justify-center pb-1 text-[10px] font-medium text-muted-foreground"
              style={{ width: hourWidth }}
            >
              {fmt12(h)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-auto">
        <div
          className="flex flex-col"
          style={{ minWidth: SIDEBAR_W + gridWidth }}
        >
          {filteredEmployees.map((emp) => {
            const rowH = rowHeights[emp.id] ?? ROLE_HDR + SHIFT_H
            const empShifts = dayShiftsByEmployee[emp.id] ?? []
            const lanes = packShifts(empShifts)

            return (
              <div
                key={emp.id}
                className="flex shrink-0 border-b border-border"
                style={{ height: rowH }}
              >
                <div
                  className="flex shrink-0 items-center border-r border-border bg-muted/50 px-2"
                  style={{
                    width: SIDEBAR_W,
                    height: rowH,
                  }}
                >
                  {slots.resourceHeader
                    ? slots.resourceHeader({
                        resource: emp,
                        scheduledCount: empShifts.length,
                        isCollapsed: false,
                        onToggleCollapse: () => {},
                      })
                    : (
                      <span className="truncate text-xs font-medium text-foreground">
                        {emp.name}
                      </span>
                    )}
                </div>
                <div
                  className="relative flex-1"
                  style={{
                    width: gridWidth,
                    height: rowH,
                  }}
                >
                  {/* Hour grid backgrounds */}
                  {hourLabels.map((h) => (
                    <div
                      key={h}
                      className="absolute bottom-0 top-0 border-r border-border"
                      style={{
                        left: (h - settings.visibleFrom) * hourWidth,
                        width: hourWidth,
                        background: isOutsideWorkingHours(h, settings, dow)
                          ? DASHED_BG
                          : hourBg(h, settings, dow),
                      }}
                    />
                  ))}

                  {/* Shift blocks */}
                  {empShifts.map((shift, i) => {
                    const cat = categoryMap[shift.categoryId]
                    if (!cat) return null
                    const c = getColor(cat.colorIdx)
                    const lane = lanes[i] ?? 0
                    const left =
                      (shift.startH - settings.visibleFrom) * hourWidth
                    const w =
                      (shift.endH - shift.startH) * hourWidth
                    const top = ROLE_HDR + lane * SHIFT_H + 2
                    const height = SHIFT_H - 4
                    const isDraft = shift.status === "draft"
                    const widthPx = Math.max(w, 24)

                    if (slots.block) {
                      return (
                        <div
                          key={shift.id}
                          className="absolute"
                          style={{ left, top, width: widthPx, height }}
                        >
                          {slots.block({
                            block: shift,
                            resource: cat,
                            isDraft,
                            isDragging: false,
                            hasConflict: false,
                            widthPx,
                            onDoubleClick: () => onShiftClick(shift, cat),
                          })}
                        </div>
                      )
                    }

                    return (
                      <button
                        key={shift.id}
                        type="button"
                        className="absolute rounded-md border text-left text-xs font-medium transition-shadow hover:shadow-md"
                        style={{
                          left,
                          top,
                          width: widthPx,
                          height,
                          background: isDraft ? c.light : c.bg,
                          color: isDraft ? c.text : "var(--background)",
                          borderColor: isDraft ? c.border : "transparent",
                          borderStyle: isDraft ? "dashed" : "solid",
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onShiftClick(shift, cat)
                        }}
                      >
                        <span className="block truncate px-1.5 py-0.5">
                          {cat.name}
                        </span>
                        <span className="block truncate px-1.5 text-[10px] opacity-90">
                          {fmt12(shift.startH)} – {fmt12(shift.endH)}
                        </span>
                      </button>
                    )
                  })}

                  {/* Add shift target: click on empty space could open add modal — optional */}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const TimelineView = React.memo(TimelineViewInner)
