import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import type { Shift, Role, Employee, Settings } from "../types"
import { ROLES, ALL_EMPLOYEES, nextUid } from "../data"
import {
  HOUR_W, SNAP, SIDEBAR_W, SHIFT_H, ROLE_HDR, HOUR_HDR_H, HOURS,
  DOW_MON_FIRST, rc, snapH, clamp, sameDay, isToday, fmt12, hourBg,
} from "../constants"
import { packShifts, getRoleRowHeight } from "../utils/packing"
import { StaffPanel } from "./StaffPanel"
import { RoleWarningModal } from "./modals/RoleWarningModal"
import { AddShiftModal } from "./modals/AddShiftModal"
import { IPlus } from "../icons"

interface DragState {
  type: 'move' | 'resize-left' | 'resize-right'
  id: string
  sx: number
  sy: number
  startH: number
  endH: number
  roleId: string
  empId: string
  dur: number
}

interface GhostState {
  ns: number
  ne: number
  roleId: string
  dayDelta: number
  id: string
}

interface GridViewProps {
  dates: Date[]
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  selEmps: Set<string>
  onShiftClick: (shift: Shift, role: Role) => void
  onAddShift: (date: Date, roleId?: string, empId?: string) => void
  settings: Settings
  isWeekView?: boolean
  setDate?: React.Dispatch<React.SetStateAction<Date>>
}

interface StaffPanelState {
  roleId: string
  anchorRect: DOMRect
}

interface DropHoverState {
  roleId: string
  di?: number
  hour?: number
}

interface RoleWarnState {
  shift?: Shift
  newRoleId?: string
  ns?: number
  ne?: number
  newDate?: Date
  empName?: string
  fromRole?: Role
  toRole?: Role
  onConfirmAction?: () => void
}

interface AddPromptState {
  date: Date
  roleId: string
  hour: number
}
export function GridView({ dates, shifts, setShifts, selEmps, onShiftClick, onAddShift, settings, isWeekView, setDate }: GridViewProps): JSX.Element {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)
  const initRef    = useRef<boolean>(false)

  const [staffPanel,    setStaffPanel]    = useState<StaffPanelState | null>(null)
  const [dragEmpId,     setDragEmpId]     = useState<string | null>(null)
  const [dragEmpRoleId, setDragEmpRoleId] = useState<string | null>(null)
  const [dropHover,     setDropHover]     = useState<DropHoverState | null>(null)
  const [roleWarn,      setRoleWarn]      = useState<RoleWarnState | null>(null)
  const [addPrompt,     setAddPrompt]     = useState<AddPromptState | null>(null)

  // ── Column widths ──────────────────────────────────────────────────────────
  const COL_W_WEEK = useMemo((): number => {
    if (!isWeekView) return HOUR_W
    const vh = settings.visibleTo - settings.visibleFrom
    return Math.max(vh * 14, 130)
  }, [isWeekView, settings])

  const PX_WEEK = isWeekView ? COL_W_WEEK / Math.max(settings.visibleTo - settings.visibleFrom, 1) : 1
  const TOTAL_W = isWeekView ? dates.length * COL_W_WEEK : HOURS.length * HOUR_W

  // ── Scroll initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft = isWeekView
        ? 7 * COL_W_WEEK
        : Math.max(0, settings.visibleFrom - 0.5) * HOUR_W
      initRef.current = true
    }
  }, [isWeekView, COL_W_WEEK, settings.visibleFrom])

  // ── Scroll handlers ────────────────────────────────────────────────────────
  const onWeekScroll = useCallback((e: React.UIEvent<HTMLDivElement>): void => {
    if (!isWeekView || !setDate) return
    const el = e.currentTarget
    if (el.scrollLeft < COL_W_WEEK * 3) {
      setDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd })
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollLeft += 7 * COL_W_WEEK })
    } else if (el.scrollLeft > TOTAL_W - COL_W_WEEK * 10) {
      setDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd })
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollLeft -= 7 * COL_W_WEEK })
    }
    if (headerRef.current)  headerRef.current.scrollLeft  = el.scrollLeft
    if (sidebarRef.current) sidebarRef.current.scrollTop  = el.scrollTop
  }, [isWeekView, setDate, COL_W_WEEK, TOTAL_W])

  const onDayScroll = useCallback((e: React.UIEvent<HTMLDivElement>): void => {
    if (isWeekView) return
    if (sidebarRef.current) sidebarRef.current.scrollTop = e.currentTarget.scrollTop
  }, [isWeekView])

  // ── Role row heights ───────────────────────────────────────────────────────
  const roleHeights = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}
    ROLES.forEach(role => {
      let maxH = ROLE_HDR + SHIFT_H
      dates.forEach(date => {
        const dayShifts = shifts.filter(s => sameDay(s.date, date) && selEmps.has(s.employeeId))
        const h = getRoleRowHeight(role.id, dayShifts)
        if (h > maxH) maxH = h
      })
      map[role.id] = maxH
    })
    return map
  }, [shifts, dates, selEmps])

  const roleTops = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {}; let acc = 0
    ROLES.forEach(r => { map[r.id] = acc; acc += roleHeights[r.id] })
    return map
  }, [roleHeights])

  const totalH = useMemo((): number => ROLES.reduce((s, r) => s + roleHeights[r.id], 0), [roleHeights])

  // ── Drag state ─────────────────────────────────────────────────────────────
  const ds = useRef<DragState | null>(null)
  const [ghost,  setGhost]  = useState<GhostState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const getGridXY = useCallback((cx: number, cy: number): { x: number; y: number } => {
    const r = gridRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return {
      x: cx - r.left  + (scrollRef.current?.scrollLeft ?? 0),
      y: cy - r.top   + (scrollRef.current?.scrollTop  ?? 0),
    }
  }, [])

  const getRoleAtY = useCallback((y: number): Role => {
    let acc = 0
    for (const role of ROLES) {
      const h = roleHeights[role.id]
      if (y >= acc && y < acc + h) return role
      acc += h
    }
    return ROLES[ROLES.length - 1]
  }, [roleHeights])

  const getHourAtX = useCallback((x: number, di: number = 0): number => {
    if (isWeekView) {
      const localX = x - di * COL_W_WEEK
      return snapH(clamp(settings.visibleFrom + localX / PX_WEEK, 0, 24))
    }
    return snapH(clamp(x / HOUR_W, 0, 24))
  }, [isWeekView, COL_W_WEEK, PX_WEEK, settings.visibleFrom])

  const getDateIdx = useCallback((x: number): number => {
    if (!isWeekView) return 0
    return clamp(Math.floor(x / COL_W_WEEK), 0, dates.length - 1)
  }, [isWeekView, COL_W_WEEK, dates.length])
  // ── Pointer down handlers ──────────────────────────────────────────────────────────
  const onBD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
    if ((e.target as HTMLElement).dataset.resize) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = getGridXY(e.clientX, e.clientY)
    ds.current = { type: "move", id: shift.id, sx: x, sy: y, startH: shift.startH, endH: shift.endH, roleId: shift.roleId, empId: shift.employeeId, dur: shift.endH - shift.startH }
    setDragId(shift.id)
  }, [getGridXY])

  const onRRD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x } = getGridXY(e.clientX, e.clientY)
    ds.current = { type: "resize-right", id: shift.id, sx: x, sy: 0, startH: shift.startH, endH: shift.endH, roleId: shift.roleId, empId: shift.employeeId, dur: 0 }
    setDragId(shift.id)
  }, [getGridXY])

  const onRLD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Shift): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x } = getGridXY(e.clientX, e.clientY)
    ds.current = { type: "resize-left", id: shift.id, sx: x, sy: 0, startH: shift.startH, endH: shift.endH, roleId: shift.roleId, empId: shift.employeeId, dur: 0 }
    setDragId(shift.id)
  }, [getGridXY])

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    const d = ds.current
    const { x, y } = getGridXY(e.clientX, e.clientY)
    const newRole = getRoleAtY(y)
    const di = getDateIdx(x)

    if (d.type === "move") {
      const dx       = x - d.sx
      const di0      = isWeekView ? getDateIdx(d.sx) : 0
      const di1      = getDateIdx(x)
      const dayDelta = di1 - di0
      const hourOffset = isWeekView
        ? snapH((dx - dayDelta * COL_W_WEEK) / PX_WEEK)
        : snapH(dx / HOUR_W)
      const ns = snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
      setGhost({ ns, ne: ns + d.dur, roleId: newRole.id, dayDelta, id: d.id })
    } else if (d.type === "resize-right") {
      const ne = snapH(clamp(d.endH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), d.startH + SNAP, 24))
      setGhost({ ns: d.startH, ne, roleId: d.roleId, dayDelta: 0, id: d.id })
    } else {
      const ns = snapH(clamp(d.startH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), 0, d.endH - SNAP))
      setGhost({ ns, ne: d.endH, roleId: d.roleId, dayDelta: 0, id: d.id })
    }
  }, [getGridXY, getRoleAtY, getDateIdx, isWeekView, COL_W_WEEK, PX_WEEK])

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    const d = ds.current
    const { x, y } = getGridXY(e.clientX, e.clientY)
    const newRole = getRoleAtY(y)
    ds.current = null; setDragId(null); setGhost(null)

    setShifts(prev => prev.map(s => {
      if (s.id !== d.id) return s
      const origEmp = ALL_EMPLOYEES.find(emp => emp.id === s.employeeId)

      if (d.type === "move") {
        const di0      = isWeekView ? getDateIdx(d.sx) : 0
        const di1      = getDateIdx(x)
        const dayDelta = di1 - di0
        const hourOffset = isWeekView
          ? snapH(((x - d.sx) - dayDelta * COL_W_WEEK) / PX_WEEK)
          : snapH((x - d.sx) / HOUR_W)
        const ns = snapH(clamp(d.startH + hourOffset, 0, 24 - d.dur))
        const origDateIdx = dates.findIndex(dt => sameDay(dt, s.date))
        const newDateIdx  = clamp(origDateIdx + dayDelta, 0, dates.length - 1)
        const newDate     = isWeekView ? new Date(dates[newDateIdx]) : s.date

        if (newRole.id !== s.roleId && origEmp && origEmp.role !== newRole.id) {
          setRoleWarn({ shift: s, newRoleId: newRole.id, ns, ne: ns + d.dur, newDate })
          return s
        }
        return { ...s, startH: ns, endH: ns + d.dur, roleId: newRole.id, date: newDate }
      } else if (d.type === "resize-right") {
        const ne = snapH(clamp(d.endH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), d.startH + SNAP, 24))
        return { ...s, endH: ne }
      } else {
        const ns = snapH(clamp(d.startH + (x - d.sx) / (isWeekView ? PX_WEEK : HOUR_W), 0, d.endH - SNAP))
        return { ...s, startH: ns }
      }
    }))
  }, [getGridXY, getRoleAtY, getDateIdx, isWeekView, COL_W_WEEK, PX_WEEK, dates, setShifts])

  // ── Staff panel drop ───────────────────────────────────────────────────────
  const onCellDrop = useCallback((e: React.DragEvent<HTMLDivElement>, roleId: string, dateIdx: number, hour: number): void => {
    e.preventDefault()
    const empId      = e.dataTransfer.getData("empId")
    const fromRoleId = e.dataTransfer.getData("roleId")
    if (!empId) return
    const emp    = ALL_EMPLOYEES.find(x => x.id === empId)
    const date   = dates[dateIdx]
    const startH = Math.floor(hour)
    const endH   = Math.min(startH + 4, 23)

    if (fromRoleId !== roleId) {
      const fromRole = ROLES.find(r => r.id === fromRoleId)
      const toRole   = ROLES.find(r => r.id === roleId)
      setRoleWarn({
        empName: emp?.name,
        fromRole,
        toRole,
        onConfirmAction: () =>
          setShifts(prev => [...prev, { id: nextUid(), roleId, employeeId: empId, date, startH, endH, employee: emp?.name || "?", status: "draft" }]),
      })
    } else {
      setShifts(prev => [...prev, { id: nextUid(), roleId, employeeId: empId, date, startH, endH, employee: emp?.name || "?", status: "draft" }])
    }
    setDropHover(null)
    setDragEmpId(null)
  }, [dates, setShifts])

  // ── Current time ───────────────────────────────────────────────────────────
  const nowH = new Date().getHours() + new Date().getMinutes() / 60
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Week day-column header */}
      {isWeekView && (
        <div style={{ display: "flex", flexShrink: 0, borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
          <div style={{ width: SIDEBAR_W, flexShrink: 0, borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "flex-end", padding: "0 12px 6px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>Roles</span>
          </div>
          <div ref={headerRef} style={{ flex: 1, overflowX: "hidden" }}>
            <div style={{ display: "flex", width: TOTAL_W }}>
              {dates.map((d, i) => {
                const today  = isToday(d)
                const closed = settings.workingHours[d.getDay()] === null
                return (
                  <div key={i} style={{ width: COL_W_WEEK, flexShrink: 0, textAlign: "center", padding: "8px 4px 6px", borderRight: "1px solid #e5e7eb", background: today ? "#eff6ff" : closed ? "#f9f9f9" : "transparent" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: today ? "#3b82f6" : closed ? "#d1d5db" : "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{DOW_MON_FIRST[(d.getDay() + 6) % 7]}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: today ? "#fff" : closed ? "#d1d5db" : "#111", background: today ? "#3b82f6" : "transparent", width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "2px auto 0" }}>{d.getDate()}</div>
                    {closed && <div style={{ fontSize: 8, color: "#d1d5db", fontWeight: 600, marginTop: 1 }}>CLOSED</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* Role sidebar */}
        <div ref={sidebarRef} style={{ width: SIDEBAR_W, flexShrink: 0, borderRight: "1px solid #e5e7eb", overflowY: "hidden", background: "#f9fafb" }}>
          {!isWeekView && <div style={{ height: HOUR_HDR_H, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }} />}
          {ROLES.map(role => {
            const c = rc(role.colorIdx)
            const h = roleHeights[role.id]
            const dayShifts0  = shifts.filter(s => sameDay(s.date, dates[0]) && selEmps.has(s.employeeId))
            const scheduled   = dayShifts0.filter(s => s.roleId === role.id).length
            return (
              <div key={role.id} style={{ height: h, borderBottom: "1px solid #e9ecef", background: "#f0f2f5", display: "flex", flexDirection: "column", justifyContent: "flex-start", flexShrink: 0, overflow: "hidden" }}>
                <div style={{ height: ROLE_HDR, display: "flex", alignItems: "center", padding: "0 10px", gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.bg, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{role.name}</span>
                  {scheduled > 0 && <span style={{ fontSize: 10, color: c.bg, fontWeight: 700, background: c.light, borderRadius: 8, padding: "1px 5px" }}>{scheduled}</span>}
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setStaffPanel(p => p?.roleId === role.id ? null : { roleId: role.id, anchorRect: rect })
                    }}
                    style={{ fontSize: 10, fontWeight: 600, color: c.text, background: c.light, border: `1px solid ${c.border}`, borderRadius: 5, padding: "2px 6px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    Staff
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Scrollable grid */}
        <div ref={scrollRef} onScroll={isWeekView ? onWeekScroll : onDayScroll} style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>

          {/* Hour header (day view) */}
          {!isWeekView && (
            <div style={{ position: "sticky", top: 0, zIndex: 12, display: "flex", width: HOURS.length * HOUR_W, height: HOUR_HDR_H, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              {HOURS.map(h => (
                <div key={h} style={{ width: HOUR_W, flexShrink: 0, height: "100%", display: "flex", alignItems: "flex-end", padding: "0 0 6px 8px", fontSize: 11, fontWeight: 600, borderRight: "1px solid #eee", background: hourBg(h, settings, dates[0].getDay()), color: h >= settings.visibleFrom && h < settings.visibleTo ? (h === Math.floor(nowH) ? "#3b82f6" : "#6b7280") : "#c0c0c0" }}>
                  {fmt12(h)}
                </div>
              ))}
            </div>
          )}

          {/* Grid canvas */}
          <div
            ref={gridRef}
            style={{ position: "relative", width: TOTAL_W, height: totalH, minHeight: "100%" }}
            onPointerMove={onPM}
            onPointerUp={onPU}
            onPointerLeave={onPU}
          >
            {/* Background cells */}
            {ROLES.map(role => {
              const top  = roleTops[role.id]
              const rowH = roleHeights[role.id]
              return dates.map((date, di) => {
                const closed = settings.workingHours[date.getDay()] === null
                const today  = isToday(date)
                if (isWeekView) {
                  return (
                    <div key={`bg-${role.id}-${di}`}
                      style={{ position: "absolute", left: di * COL_W_WEEK, top, width: COL_W_WEEK, height: rowH, background: today ? "#f7faff" : closed ? "#f9f9f9" : "#fafafa", borderRight: "1px solid #f0f0f0", borderBottom: "1px solid #ebebeb" }}
                      onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDropHover({ roleId: role.id, di }) }}
                      onDrop={(e: React.DragEvent<HTMLDivElement>) => onCellDrop(e, role.id, di, settings.visibleFrom)}
                    >
                      {Array.from({ length: settings.visibleTo - settings.visibleFrom + 1 }, (_, k) => (
                        <div key={k} style={{ position: "absolute", left: k * PX_WEEK, top: 0, width: 1, height: "100%", background: k % 2 === 0 ? "#e8e8e8" : "#f3f3f3", pointerEvents: "none" }} />
                      ))}
                    </div>
                  )
                }
                return HOURS.map(h => (
                  <div key={`bg-${role.id}-${h}`}
                    style={{ position: "absolute", left: h * HOUR_W, top, width: HOUR_W, height: rowH, background: hourBg(h, settings, date.getDay()), borderRight: "1px solid #ebebeb" }}
                    onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDropHover({ roleId: role.id, hour: h }) }}
                    onDrop={(e: React.DragEvent<HTMLDivElement>) => onCellDrop(e, role.id, 0, h)}
                  />
                ))
              })
            })}

            {/* Role separator lines */}
            {ROLES.map(role => (
              <div key={`sep-${role.id}`} style={{ position: "absolute", left: 0, top: roleTops[role.id] + roleHeights[role.id] - 1, width: TOTAL_W, height: 2, background: "#e5e7eb", zIndex: 3, pointerEvents: "none" }} />
            ))}

            {/* Vertical hour lines (day view) */}
            {!isWeekView && HOURS.map(h => (
              <div key={`vl-${h}`} style={{ position: "absolute", left: h * HOUR_W, top: 0, width: 1, height: totalH, background: "#e8e8e8", zIndex: 1, pointerEvents: "none" }} />
            ))}

            {/* Current time indicator */}
            {dates.map((d, di) => isToday(d) && (
              <div key={`now-${di}`} style={{ position: "absolute", left: isWeekView ? di * COL_W_WEEK + (nowH - settings.visibleFrom) * PX_WEEK : nowH * HOUR_W, top: 0, height: totalH, width: 2, background: "#ef4444", zIndex: 15, pointerEvents: "none", boxShadow: "0 0 8px rgba(239,68,68,0.35)" }}>
                <div style={{ position: "absolute", top: 0, left: -4, width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              </div>
            ))}

            {/* + Add buttons */}
            {ROLES.map(role => {
              const top  = roleTops[role.id]
              const rowH = roleHeights[role.id]
              if (isWeekView) {
                return dates.map((date, di) => (
                  <button key={`add-${role.id}-${di}`}
                    onClick={() => setAddPrompt({ date, roleId: role.id, hour: settings.visibleFrom })}
                    style={{ position: "absolute", left: di * COL_W_WEEK + COL_W_WEEK / 2 - 10, top: top + rowH / 2 - 10, width: 20, height: 20, borderRadius: "50%", border: "1.5px dashed #c8d0dc", background: "rgba(255,255,255,0.95)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aab8", zIndex: 4, padding: 0 }}
                  >
                    <IPlus size={9} />
                  </button>
                ))
              }
              return HOURS.filter(h => h >= settings.visibleFrom && h < settings.visibleTo).map(h => (
                <button key={`add-${role.id}-${h}`}
                  onClick={() => setAddPrompt({ date: dates[0], roleId: role.id, hour: h })}
                  style={{ position: "absolute", left: h * HOUR_W + HOUR_W / 2 - 9, top: top + ROLE_HDR + 2, width: 18, height: 18, borderRadius: "50%", border: "1.5px dashed #d1d5db", background: "rgba(255,255,255,0.9)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0b8c4", zIndex: 4, padding: 0, opacity: 0.7 }}
                >
                  <IPlus size={8} />
                </button>
              ))
            })}

            {/* Drop highlight */}
            {dropHover && dragEmpId && (() => {
              const role = ROLES.find(r => r.id === dropHover.roleId)
              if (!role) return null
              const c    = rc(role.colorIdx)
              const top  = roleTops[role.id]
              const rowH = roleHeights[role.id]
              if (isWeekView) return <div style={{ position: "absolute", left: (dropHover.di ?? 0) * COL_W_WEEK, top, width: COL_W_WEEK, height: rowH, background: `${c.bg}18`, border: `2px dashed ${c.bg}`, borderRadius: 4, pointerEvents: "none", zIndex: 10 }} />
              return <div style={{ position: "absolute", left: (dropHover.hour ?? 0) * HOUR_W, top, width: HOUR_W * 2, height: rowH, background: `${c.bg}18`, border: `2px dashed ${c.bg}`, borderRadius: 4, pointerEvents: "none", zIndex: 10 }} />
            })()}

            {/* Ghost overlay */}
            {ghost && (() => {
              const orig = shifts.find(s => s.id === ghost.id)
              if (!orig) return null
              const role = ROLES.find(r => r.id === ghost.roleId)
              if (!role) return null
              const c    = rc(role.colorIdx)
              const top  = roleTops[role.id]
              let left: number, width: number
              if (isWeekView) {
                const origDi = dates.findIndex(d => sameDay(d, orig.date))
                const newDi  = clamp(origDi + (ghost.dayDelta ?? 0), 0, dates.length - 1)
                left  = newDi * COL_W_WEEK + (ghost.ns - settings.visibleFrom) * PX_WEEK
                width = Math.max((ghost.ne - ghost.ns) * PX_WEEK - 2, 8)
              } else {
                left  = ghost.ns * HOUR_W + 2
                width = Math.max((ghost.ne - ghost.ns) * HOUR_W - 4, 10)
              }
              return (
                <div style={{ position: "absolute", left, top: top + ROLE_HDR + 3, width, height: SHIFT_H - 6, background: c.bg, opacity: 0.2, borderRadius: 5, border: `2px dashed ${c.bg}`, pointerEvents: "none", zIndex: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: c.bg, background: "rgba(255,255,255,0.9)", borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>
                    {fmt12(ghost.ns)}–{fmt12(ghost.ne)}
                  </span>
                </div>
              )
            })()}
            {/* Shift blocks */}
            {ROLES.map(role => {
              const roleTop = roleTops[role.id]
              return dates.map((date, di) => {
                const dayShifts = shifts.filter(s => sameDay(s.date, date) && s.roleId === role.id && selEmps.has(s.employeeId))
                const sorted    = [...dayShifts].sort((a, b) => a.startH - b.startH)
                const trackNums = packShifts(sorted)
                const c         = rc(role.colorIdx)

                return sorted.map((shift, si) => {
                  const track   = trackNums[si]
                  const isDraft = shift.status === "draft"
                  const isDrag  = dragId === shift.id
                  const top     = roleTop + ROLE_HDR + track * SHIFT_H + 3

                  let left: number, width: number
                  if (isWeekView) {
                    const cs = Math.max(shift.startH, settings.visibleFrom)
                    const ce = Math.min(shift.endH,   settings.visibleTo)
                    if (ce <= cs) return null
                    left  = di * COL_W_WEEK + (cs - settings.visibleFrom) * PX_WEEK + 1
                    width = Math.max((ce - cs) * PX_WEEK - 2, 12)
                  } else {
                    left  = shift.startH * HOUR_W + 2
                    width = Math.max((shift.endH - shift.startH) * HOUR_W - 4, 18)
                  }

                  return (
                    <div key={shift.id}
                      onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onBD(e, shift)}
                      onClick={() => { if (!dragId) onShiftClick(shift, role) }}
                      style={{ position: "absolute", left, top, width, height: SHIFT_H - 6, borderRadius: 5, cursor: isDrag ? "grabbing" : "grab", userSelect: "none", touchAction: "none", opacity: isDrag ? 0.3 : 1, background: isDraft ? "transparent" : `linear-gradient(135deg,${c.bg},${c.bg}cc)`, border: isDraft ? `1.5px dashed ${c.bg}` : `1px solid ${c.bg}88`, boxShadow: isDrag || isDraft ? "none" : `0 2px 6px ${c.bg}44`, zIndex: isDrag ? 20 : 8, overflow: "hidden", display: "flex", alignItems: "center" }}
                    >
                      {/* Left resize */}
                      <div data-resize="left" onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRLD(e, shift)} style={{ width: 9, height: "100%", cursor: "ew-resize", flexShrink: 0, background: isDraft ? `${c.bg}22` : "rgba(0,0,0,0.13)", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: isDraft ? c.bg : "rgba(255,255,255,0.65)" }} />)}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, padding: "0 3px", overflow: "hidden", pointerEvents: "none", minWidth: 0 }}>
                        {width > 28 && (
                          <div style={{ color: isDraft ? c.bg : "#fff", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 2 }}>
                            {isDraft && <span style={{ fontSize: 8, background: c.bg, color: "#fff", borderRadius: 2, padding: "0 2px", flexShrink: 0 }}>D</span>}
                            {width > 60 ? shift.employee.split(" ")[0] : shift.employee[0]}
                          </div>
                        )}
                        {width > 52 && (
                          <div style={{ color: isDraft ? c.text : "rgba(255,255,255,0.8)", fontSize: 9, whiteSpace: "nowrap" }}>
                            {fmt12(shift.startH)}–{fmt12(shift.endH)}
                          </div>
                        )}
                      </div>

                      {/* Right resize */}
                      <div data-resize="right" onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => onRRD(e, shift)} style={{ width: 9, height: "100%", cursor: "ew-resize", flexShrink: 0, background: isDraft ? `${c.bg}22` : "rgba(0,0,0,0.13)", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none" }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: isDraft ? c.bg : "rgba(255,255,255,0.65)" }} />)}
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
      {/* Staff Panel */}
      {staffPanel && (() => {
        const role      = ROLES.find(r => r.id === staffPanel.roleId)
        const date      = dates[isWeekView ? Math.floor(dates.length / 2) : 0]
        const dayShifts = shifts.filter(s => sameDay(s.date, date))
        return role ? (
          <StaffPanel
            role={role}
            date={date}
            dayShifts={dayShifts}
            anchorRect={staffPanel.anchorRect}
            onDragStaff={(empId: string, roleId: string) => { setDragEmpId(empId); setDragEmpRoleId(roleId) }}
            onClose={() => setStaffPanel(null)}
          />
        ) : null
      })()}

      {/* Role warning modal */}
      {roleWarn && (() => {
        if (roleWarn.onConfirmAction) {
          const emp = ALL_EMPLOYEES.find(e => e.name === roleWarn.empName)
          return roleWarn.fromRole && roleWarn.toRole ? (
            <RoleWarningModal
              emp={emp || null}
              fromRole={roleWarn.fromRole}
              toRole={roleWarn.toRole}
              onConfirm={() => { roleWarn.onConfirmAction?.(); setRoleWarn(null) }}
              onCancel={() => setRoleWarn(null)}
            />
          ) : null
        }
        const { shift, newRoleId, ns, ne, newDate } = roleWarn
        if (!shift || !newRoleId || ns === undefined || ne === undefined || !newDate) return null
        const emp      = ALL_EMPLOYEES.find(e => e.id === shift.employeeId)
        const fromRole = ROLES.find(r => r.id === emp?.role)
        const toRole   = ROLES.find(r => r.id === newRoleId)
        return fromRole && toRole ? (
          <RoleWarningModal
            emp={emp || null}
            fromRole={fromRole}
            toRole={toRole}
            onConfirm={() => {
              setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, startH: ns, endH: ne, roleId: newRoleId, date: newDate } : s))
              setRoleWarn(null)
            }}
            onCancel={() => setRoleWarn(null)}
          />
        ) : null
      })()}

      {/* Add shift from + button */}
      {addPrompt && (
        <AddShiftModal
          date={addPrompt.date}
          roleId={addPrompt.roleId}
          employeeId={undefined}
          prefillStartH={addPrompt.hour}
          onAdd={(shift: Shift) => setShifts(prev => [...prev, shift])}
          onClose={() => setAddPrompt(null)}
        />
      )}
    </div>
  )
}