import React, { useState, useEffect } from "react"
import type { Shift } from "../../../types"
import { ROLES, ALL_EMPLOYEES, nextUid } from "../../../data"
import { HOURS, rc, fmtHourOpt } from "../../../constants"

const LBL: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginTop: 10, marginBottom: 3 }
const SEL: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }

interface AddShiftModalProps {
  date: Date
  roleId?: string
  employeeId?: string
  prefillStartH?: number
  onAdd: (shift: Shift) => void
  onClose: () => void
}

export function AddShiftModal({ date, roleId, employeeId, prefillStartH, onAdd, onClose }: AddShiftModalProps): JSX.Element {
  const [role,   setRole]  = useState<string>(roleId  || ROLES[0].id)
  const [emp,    setEmp]   = useState<string>(employeeId || ALL_EMPLOYEES.find(e => e.role === (roleId || ROLES[0].id))?.id || ALL_EMPLOYEES[0].id)
  const [startH, setSH]    = useState<number>(prefillStartH !== undefined ? prefillStartH : 9)
  const [endH,   setEH]    = useState<number>(prefillStartH !== undefined ? Math.min(prefillStartH + 4, 23) : 17)

  const cr = ROLES.find(r => r.id === role)
  const c  = cr ? rc(cr.colorIdx) : rc(0)

  useEffect(() => {
    const e = ALL_EMPLOYEES.find(e => e.role === role)
    if (e) setEmp(e.id)
  }, [role])

  const submit = (): void => {
    const e = ALL_EMPLOYEES.find(x => x.id === emp)
    onAdd({
      id:         nextUid(),
      roleId:     role,
      employeeId: emp,
      date,
      startH,
      endH,
      employee:   e?.name || "?",
      status:     "draft",
    })
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setRole(e.target.value)
  }

  const handleEmpChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setEmp(e.target.value)
  }

  const handleStartHChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSH(+e.target.value)
  }

  const handleEndHChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setEH(+e.target.value)
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={handleModalClick}
        style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", width: 320, borderTop: `4px solid ${c.bg}` }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>Add Shift</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          {date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
        </div>

        <label style={LBL}>Role</label>
        <select value={role} onChange={handleRoleChange} style={SEL}>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <label style={LBL}>Employee</label>
        <select value={emp} onChange={handleEmpChange} style={SEL}>
          {ALL_EMPLOYEES.filter(e => e.role === role).map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={LBL}>Start</label>
            <select value={startH} onChange={handleStartHChange} style={SEL}>
              {HOURS.map(h => <option key={h} value={h}>{fmtHourOpt(h)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={LBL}>End</label>
            <select value={endH} onChange={handleEndHChange} style={SEL}>
              {HOURS.filter(h => h > startH).map(h => (
                <option key={h} value={h}>{fmtHourOpt(h)}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={submit}
            style={{ flex: 1, padding: "9px", background: c.bg, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Add Shift
          </button>
          <button
            onClick={onClose}
            style={{ padding: "9px 14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}