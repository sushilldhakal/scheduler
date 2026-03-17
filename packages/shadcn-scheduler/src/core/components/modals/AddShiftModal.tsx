import React, { useState, useEffect } from "react"
import type { Block } from "../../types"
import { useSchedulerContext } from "../../context"
import { HOURS, fmtHourOpt, toDateISO } from "../../constants"

const LBL: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted-foreground)",
  marginTop: 10,
  marginBottom: 3,
}
const SEL: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid var(--border))",
  borderRadius: 7,
  fontSize: 12,
  color: "var(--foreground)",
  background: "var(--background)",
  cursor: "pointer",
  outline: "none",
}

interface AddShiftModalProps {
  date: Date
  categoryId?: string
  employeeId?: string
  prefillStartH?: number
  onAdd: (block: Block) => void
  onClose: () => void
}

export function AddShiftModal({
  date,
  categoryId,
  employeeId,
  prefillStartH,
  onAdd,
  onClose,
}: AddShiftModalProps): React.ReactElement {
  const { categories, employees, nextUid, getColor, labels } = useSchedulerContext()
  const [category, setCategory] = useState<string>(
    categoryId || categories[0]?.id || ""
  )
  const [emp, setEmp] = useState<string>(
    employeeId ||
      employees.find((e) => e.categoryId === (categoryId || categories[0]?.id))?.id ||
      employees[0]?.id ||
      ""
  )
  const [startH, setSH] = useState<number>(
    prefillStartH !== undefined ? prefillStartH : 9
  )
  const [endH, setEH] = useState<number>(
    prefillStartH !== undefined ? Math.min(prefillStartH + 4, 23) : 17
  )

  const cr = categories.find((r) => r.id === category)
  const c = cr ? getColor(cr.colorIdx) : getColor(0)

  useEffect(() => {
    const e = employees.find((e) => e.categoryId === category)
    if (e) setEmp(e.id)
  }, [category, employees])

  const submit = (): void => {
    const e = employees.find((x) => x.id === emp)
    onAdd({
      id: nextUid(),
      categoryId: category,
      employeeId: emp,
      date: toDateISO(date),
      startH,
      endH,
      employee: e?.name || "?",
      status: "draft",
    })
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
  }

  const categoryEmployees = employees.filter((e) => e.categoryId === category)

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={handleModalClick}
        style={{
          background: "var(--background)",
          borderRadius: 16,
          padding: "22px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          width: 320,
          borderTop: `4px solid ${c.bg}`,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)", marginBottom: 4 }}>
          {labels.addShift}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 16 }}>
          {date.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>

        <label style={LBL}>{labels.category}</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={SEL}
        >
          {categories.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <label style={LBL}>{labels.employee}</label>
        <select value={emp} onChange={(e) => setEmp(e.target.value)} style={SEL}>
          {categoryEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={LBL}>Start</label>
            <select
              value={startH}
              onChange={(e) => setSH(+e.target.value)}
              style={SEL}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {fmtHourOpt(h)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={LBL}>End</label>
            <select
              value={endH}
              onChange={(e) => setEH(+e.target.value)}
              style={SEL}
            >
              {HOURS.filter((h) => h > startH).map((h) => (
                <option key={h} value={h}>
                  {fmtHourOpt(h)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={submit}
            style={{
              flex: 1,
              padding: "9px",
              background: c.bg,
              color: "var(--background)",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {labels.addShift}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "9px 14px",
              background: "var(--border))",
              color: "var(--foreground)",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
