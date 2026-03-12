import React, { useRef, useState, useCallback, useMemo } from "react"
import type { Shift, Role } from "../../types"
import { ROLES } from "../../data"
import { rc, sameDay, isToday, fmt12, DAY_NAMES, MONTHS_SHORT, getWeekDates, getDIM } from "../../constants"

interface ListViewProps {
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  onShiftClick: (shift: Shift, role: Role) => void
  onPublish: (...shiftIds: string[]) => void
  onUnpublish: (shiftId: string) => void
  currentDate: Date
  view: string
}

interface DragState {
  id: string
}

interface GhostPosition {
  x: number
  y: number
}

interface GroupedDay {
  date: Date
  shifts: Shift[]
}

export function ListView({ shifts, setShifts, onShiftClick, onPublish, onUnpublish, currentDate, view }: ListViewProps): JSX.Element {
  const base    = view.replace("list", "") || "day"
  const roleMap: Record<string, Role> = Object.fromEntries(ROLES.map(r => [r.id, r]))

  // ── Date range for current view ────────────────────────────────────────────
  const [start, end] = useMemo((): [Date, Date] => {
    if (base === "day") return [currentDate, currentDate]
    if (base === "week") {
      const wd = getWeekDates(currentDate)
      return [wd[0], wd[6]]
    }
    if (base === "month") {
      const y = currentDate.getFullYear(), m = currentDate.getMonth()
      return [new Date(y, m, 1), new Date(y, m + 1, 0)]
    }
    const y = currentDate.getFullYear()
    return [new Date(y, 0, 1), new Date(y, 11, 31)]
  }, [base, currentDate])

  // ── Grouped shifts by day ──────────────────────────────────────────────────
  const grouped = useMemo((): GroupedDay[] => {
    const inRange = shifts.filter(s => {
      const sd = new Date(s.date); sd.setHours(0, 0, 0, 0)
      const st = new Date(start);  st.setHours(0, 0, 0, 0)
      const en = new Date(end);    en.setHours(0, 0, 0, 0)
      return sd >= st && sd <= en
    })
    inRange.sort((a, b) => a.date.getTime() - b.date.getTime() || a.startH - b.startH)
    const map = new Map<string, GroupedDay>()
    inRange.forEach(s => {
      const k = s.date.toDateString()
      if (!map.has(k)) map.set(k, { date: s.date, shifts: [] })
      map.get(k)!.shifts.push(s)
    })
    return Array.from(map.values())
  }, [shifts, start, end])

  // ── Drag to reorder across days ────────────────────────────────────────────
  const ds = useRef<DragState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropT,  setDropT]  = useState<string | null>(null)
  const [gPos,   setGPos]   = useState<GhostPosition | null>(null)

  const onIPD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    ds.current = { id: shift.id }
    setDragId(shift.id)
  }, [])

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    setGPos({ x: e.clientX, y: e.clientY })
    const el = document.elementFromPoint(e.clientX, e.clientY)
    setDropT(el?.closest("[data-drop-date]")?.getAttribute("data-drop-date") ?? null)
  }, [])

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const dt = el?.closest("[data-drop-date]")?.getAttribute("data-drop-date")
    const id = ds.current.id
    ds.current = null; setDragId(null); setDropT(null); setGPos(null)
    if (dt) setShifts(prev => prev.map(s => s.id === id ? { ...s, date: new Date(dt) } : s))
  }, [setShifts])

  if (!grouped.length) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
        No shifts in this period
      </div>
    )
  }
  return (
    <div
      style={{ flex: 1, overflowY: "auto", paddingBottom: 24, userSelect: "none", position: "relative" }}
      onPointerMove={onPM}
      onPointerUp={onPU}
    >
      {grouped.map(({ date, shifts: ds_ }) => {
        const drafts  = ds_.filter(s => s.status === "draft")
        const dateStr = date.toISOString().split("T")[0]
        const isOT    = dropT === dateStr

        const handlePublishAll = (): void => {
          onPublish(...drafts.map(s => s.id))
        }

        const handleShiftClick = (shift: Shift, role: Role): void => {
          if (!dragId) onShiftClick(shift, role)
        }

        const handleStatusToggle = (e: React.MouseEvent, shift: Shift, isDraft: boolean): void => {
          e.stopPropagation()
          if (isDraft) {
            onPublish(shift.id)
          } else {
            onUnpublish(shift.id)
          }
        }

        return (
          <div key={date.toDateString()}>
            {/* Day header */}
            <div
              data-drop-date={dateStr}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px", background: isOT ? "#eff6ff" : "#f8fafc", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 5, outline: isOT ? "2px solid #3b82f6" : "none", outlineOffset: -2 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isToday(date) ? "#3b82f6" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isToday(date) ? "#fff" : "#374151" }}>{date.getDate()}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                    {DAY_NAMES[date.getDay()]}, {MONTHS_SHORT[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {ds_.length} shift{ds_.length !== 1 ? "s" : ""}{drafts.length > 0 ? ` · ${drafts.length} draft` : ""}
                  </div>
                </div>
              </div>
              {drafts.length > 0 && (
                <button
                  onClick={handlePublishAll}
                  style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "#dcfce7", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
                >
                  Publish all
                </button>
              )}
            </div>
            {/* Shift rows */}
            {ds_.map(shift => {
              const role   = roleMap[shift.roleId]
              const c      = rc(role?.colorIdx ?? 0)
              const isDraft = shift.status === "draft"
              const isDrag  = dragId === shift.id
              return (
                <div
                  key={shift.id}
                  data-drop-date={dateStr}
                  onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onIPD(e, shift)}
                  onClick={() => handleShiftClick(shift, role)}
                  style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #f3f4f6", cursor: isDrag ? "grabbing" : "grab", background: isDrag ? "#f0f7ff" : "#fff", opacity: isDrag ? 0.5 : 1, touchAction: "none" }}
                >
                  <div style={{ marginRight: 10, color: "#d1d5db", fontSize: 14, flexShrink: 0 }}>⠿</div>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: c.bg, marginRight: 14, flexShrink: 0, opacity: isDraft ? 0.4 : 1 }} />
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isDraft ? "transparent" : c.light, border: isDraft ? `1.5px dashed ${c.bg}` : "none", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.bg, opacity: isDraft ? 0.6 : 1 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{shift.employee}</span>
                      {isDraft && <span style={{ fontSize: 9, fontWeight: 700, background: "#fef9c3", color: "#854d0e", borderRadius: 4, padding: "1px 5px" }}>DRAFT</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
                      {role?.name} · {fmt12(shift.startH)} – {fmt12(shift.endH)} · {shift.endH - shift.startH}h
                    </div>
                  </div>
                  <div
                    onClick={(e: React.MouseEvent) => handleStatusToggle(e, shift, isDraft)}
                    style={{ fontSize: 11, fontWeight: 600, color: isDraft ? "#22c55e" : "#9ca3af", background: isDraft ? "#dcfce7" : "#f3f4f6", borderRadius: 6, padding: "4px 10px", flexShrink: 0, cursor: "pointer" }}
                  >
                    {isDraft ? "Publish" : "Draft"}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Drag ghost */}
      {gPos && dragId && (() => {
        const s = shifts.find(x => x.id === dragId)
        if (!s) return null
        const c = rc(roleMap[s.roleId]?.colorIdx ?? 0)
        return (
          <div style={{ position: "fixed", left: gPos.x + 14, top: gPos.y - 12, background: c.bg, color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
            {s.employee} · {fmt12(s.startH)}–{fmt12(s.endH)}
          </div>
        )
      })()}
    </div>
  )
}