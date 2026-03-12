import React, { useRef, useState, useCallback } from "react"
import type { Shift, Role, Settings } from "../../types"
import { ROLES } from "../../data"
import { rc, sameDay, isToday, fmt12, getDIM, getFirst, DOW_MON_FIRST } from "../../constants"
import { IPlus } from "../../icons"

interface MonthViewProps {
  date: Date
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  onShiftClick: (shift: Shift, role: Role) => void
  onAddShift: (date: Date, roleId?: string | null, empId?: string | null) => void
  settings: Settings
}

interface DragState {
  id: string
}

interface GhostPosition {
  x: number
  y: number
}

export function MonthView({ date, shifts, setShifts, onShiftClick, onAddShift, settings }: MonthViewProps): JSX.Element {
  const y          = date.getFullYear()
  const m          = date.getMonth()
  const daysInMonth = getDIM(y, m)
  const firstDay   = getFirst(y, m)

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay;   i++) cells.push(null)
  for (let d  = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))

  const roleMap: Record<string, Role> = Object.fromEntries(ROLES.map(r => [r.id, r]))

  const ref = useRef<HTMLDivElement>(null)
  const ds  = useRef<DragState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropT,  setDropT]  = useState<string | null>(null)
  const [gPos,   setGPos]   = useState<GhostPosition | null>(null)

  const getCD = useCallback((cx: number, cy: number): string | null => {
    const el = document.elementFromPoint(cx, cy)
    return el?.closest("[data-cell-date]")?.getAttribute("data-cell-date") ?? null
  }, [])

  const onSPD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    ds.current = { id: shift.id }
    setDragId(shift.id)
  }, [])

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    setGPos({ x: e.clientX, y: e.clientY })
    setDropT(getCD(e.clientX, e.clientY))
  }, [getCD])

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    const cd = getCD(e.clientX, e.clientY)
    const id = ds.current.id
    ds.current = null; setDragId(null); setDropT(null); setGPos(null)
    if (cd) setShifts(prev => prev.map(s => s.id === id ? { ...s, date: new Date(cd) } : s))
  }, [getCD, setShifts])

  const handleAddShift = (d: Date): void => {
    onAddShift(d, null, null)
  }

  const handleShiftClick = (shift: Shift, role: Role): void => {
    if (!dragId) onShiftClick(shift, role)
  }

  return (
    <div
      ref={ref}
      style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", userSelect: "none" }}
      onPointerMove={onPM}
      onPointerUp={onPU}
    >
      {/* Day-of-week header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "2px solid #e5e7eb", flexShrink: 0 }}>
        {DOW_MON_FIRST.map(d => (
          <div key={d} style={{ textAlign: "center", padding: "8px 0", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridAutoRows: "minmax(96px,1fr)" }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} style={{ background: "#fafafa", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }} />

          const today     = isToday(d)
          const closed    = settings.workingHours[d.getDay()] === null
          const dayShifts = shifts.filter(s => sameDay(s.date, d))
          const ck        = d.toISOString().split("T")[0]
          const isOver    = dropT === ck

          return (
            <div
              key={d.toISOString()}
              data-cell-date={ck}
              style={{ borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "5px 4px", background: isOver ? "#eff6ff" : today ? "#f0f7ff" : closed ? "#f9f9f9" : "#fff", display: "flex", flexDirection: "column", gap: 2, outline: isOver ? "2px solid #3b82f6" : "none", outlineOffset: -2, minHeight: 96, position: "relative" }}
            >
              {/* Date number + add button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <div style={{ fontSize: 13, fontWeight: today ? 700 : 500, color: today ? "#fff" : closed ? "#ccc" : "#374151", background: today ? "#3b82f6" : "transparent", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {d.getDate()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  {closed && <span style={{ fontSize: 9, color: "#d1d5db", fontWeight: 600 }}>CLOSED</span>}
                  <button
                    onClick={() => handleAddShift(d)}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px dashed #d1d5db", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0b8c4", padding: 0, opacity: 0.7 }}
                  >
                    <IPlus size={8} />
                  </button>
                </div>
              </div>

              {/* Shift pills */}
              {dayShifts.slice(0, 3).map(shift => {
                const role  = roleMap[shift.roleId]
                if (!role) return null
                const c       = rc(role.colorIdx)
                const isDraft = shift.status === "draft"
                const isDrag  = dragId === shift.id
                return (
                  <div
                    key={shift.id}
                    onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onSPD(e, shift)}
                    onClick={() => handleShiftClick(shift, role)}
                    style={{ background: isDraft ? "transparent" : c.bg, border: isDraft ? `1.5px dashed ${c.bg}` : "none", color: isDraft ? c.bg : "#fff", borderRadius: 4, padding: "2px 5px", fontSize: 10, fontWeight: 600, cursor: isDrag ? "grabbing" : "grab", opacity: isDrag ? 0.3 : 1, touchAction: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {isDraft && "✎ "}{shift.employee.split(" ")[0]} {fmt12(shift.startH)}
                  </div>
                )
              })}
              {dayShifts.length > 3 && (
                <div style={{ fontSize: 10, color: "#6b7280", paddingLeft: 2 }}>+{dayShifts.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Drag ghost */}
      {gPos && dragId && (() => {
        const s = shifts.find(x => x.id === dragId)
        if (!s) return null
        const c = rc(roleMap[s.roleId]?.colorIdx ?? 0)
        return (
          <div style={{ position: "fixed", left: gPos.x + 12, top: gPos.y - 10, background: c.bg, color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
            {s.employee.split(" ")[0]} · {fmt12(s.startH)}–{fmt12(s.endH)}
          </div>
        )
      })()}
    </div>
  )
}