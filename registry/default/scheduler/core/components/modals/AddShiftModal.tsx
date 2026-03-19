import React, { useState, useEffect } from "react"
import type { Block } from "../../types"
import { useSchedulerContext } from "../../context"
import { HOURS, fmtHourOpt, toDateISO } from "../../constants"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { CalendarIcon, Clock } from "lucide-react"

interface AddShiftModalProps {
  date: Date
  categoryId?: string
  employeeId?: string
  prefillStartH?: number
  onAdd: (block: Block) => void
  onClose: () => void
}

const LBL: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  color: "var(--muted-foreground)", marginBottom: 4,
}
const SEL: React.CSSProperties = {
  width: "100%", padding: "6px 8px", border: "1px solid var(--border)",
  borderRadius: 7, fontSize: 12, color: "var(--foreground)",
  background: "var(--background)", cursor: "pointer", outline: "none",
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })
}

export function AddShiftModal({
  date: initialDate, categoryId, employeeId, prefillStartH, onAdd, onClose,
}: AddShiftModalProps): React.ReactElement {
  const { categories, employees, nextUid, getColor, labels } = useSchedulerContext()

  const [date, setDate] = useState<Date>(initialDate)
  const [dateOpen, setDateOpen] = useState(false)
  const [category, setCategory] = useState(categoryId || categories[0]?.id || "")
  const [emp, setEmp] = useState(
    employeeId ||
    employees.find((e) => e.categoryId === (categoryId || categories[0]?.id))?.id ||
    employees[0]?.id || ""
  )
  const [startH, setSH] = useState(prefillStartH !== undefined ? prefillStartH : 9)
  const [endH, setEH] = useState(prefillStartH !== undefined ? Math.min(prefillStartH + 4, 23) : 17)

  // Break state
  const [hasBreak, setHasBreak] = useState(false)
  const [splitShift, setSplitShift] = useState(false)
  const [breakStartH, setBreakSH] = useState(12)
  const [breakEndH, setBreakEH] = useState(13)
  const [breakDurMin, setBreakDurMin] = useState(30)

  const cr = categories.find((r) => r.id === category)
  const c = cr ? getColor(cr.colorIdx) : getColor(0)

  useEffect(() => {
    const e = employees.find((e) => e.categoryId === category)
    if (e) setEmp(e.id)
  }, [category, employees])

  const categoryEmployees = employees.filter((e) => e.categoryId === category)

  const totalHours = endH - startH
  const breakHours = hasBreak ? (splitShift ? breakEndH - breakStartH : breakDurMin / 60) : 0
  const workedHours = Math.max(0, totalHours - breakHours)

  const timeDisplay = (): string => {
    const s = fmtHourOpt(startH)
    const e = fmtHourOpt(endH)
    if (!hasBreak) return `${s} – ${e}`
    if (splitShift) return `${s} – ${fmtHourOpt(breakStartH)} / ${fmtHourOpt(breakEndH)} – ${e}`
    return `${s} – ${e} (${breakDurMin}m break)`
  }

  const submit = () => {
    const e = employees.find((x) => x.id === emp)
    const block: Block = {
      id: nextUid(),
      categoryId: category,
      employeeId: emp,
      date: toDateISO(date),
      startH,
      endH,
      employee: e?.name || "?",
      status: "draft",
    }
    if (hasBreak) {
      if (splitShift) {
        block.breakStartH = breakStartH
        block.breakEndH = breakEndH
      } else {
        const mid = startH + (endH - startH) / 2
        const durH = breakDurMin / 60
        block.breakStartH = parseFloat((mid - durH / 2).toFixed(2))
        block.breakEndH = parseFloat((mid + durH / 2).toFixed(2))
      }
    }
    onAdd(block)
    onClose()
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--background)", borderRadius: 16, padding: "22px 24px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", width: 340, borderTop: `4px solid ${c.bg}`, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)", marginBottom: 4 }}>{labels.addShift}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Date picker */}
          <div>
            <label style={LBL}>{"Date"}</label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 7,
                  background: "var(--background)", cursor: "pointer", fontSize: 13,
                  color: "var(--foreground)", textAlign: "left",
                }}>
                  <CalendarIcon size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  {fmtDate(date)}
                </button>
              </PopoverTrigger>
              <PopoverContent style={{ padding: 0 }} align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setDateOpen(false) } }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Category */}
          <div>
            <label style={LBL}>{labels.category}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={SEL}>
              {categories.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* Employee */}
          <div>
            <label style={LBL}>{labels.employee}</label>
            <select value={emp} onChange={(e) => setEmp(e.target.value)} style={SEL}>
              {categoryEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {/* Time */}
          <div>
            <label style={LBL}>Time</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={startH} onChange={(e) => setSH(+e.target.value)} style={{ ...SEL, flex: 1 }}>
                {HOURS.map((h) => <option key={h} value={h}>{fmtHourOpt(h)}</option>)}
              </select>
              <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--muted-foreground)", flexShrink: 0 }}>to</span>
              <select value={endH} onChange={(e) => setEH(+e.target.value)} style={{ ...SEL, flex: 1 }}>
                {HOURS.filter((h) => h > startH).map((h) => <option key={h} value={h}>{fmtHourOpt(h)}</option>)}
              </select>
            </div>
          </div>

          {/* Break section */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
              <input
                type="checkbox" checked={hasBreak}
                onChange={(e) => setHasBreak(e.target.checked)}
                style={{ width: 14, height: 14, cursor: "pointer", accentColor: c.bg }}
              />
              Add break
            </label>

            {hasBreak && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "var(--muted-foreground)" }}>
                  <input
                    type="checkbox" checked={splitShift}
                    onChange={(e) => setSplitShift(e.target.checked)}
                    style={{ width: 13, height: 13, cursor: "pointer", accentColor: c.bg }}
                  />
                  Split shift — set exact break times
                </label>

                {splitShift ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={LBL}>Break start</label>
                      <select value={breakStartH} onChange={(e) => setBreakSH(+e.target.value)} style={SEL}>
                        {HOURS.filter((h) => h > startH && h < endH).map((h) => (
                          <option key={h} value={h}>{fmtHourOpt(h)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={LBL}>Break end</label>
                      <select value={breakEndH} onChange={(e) => setBreakEH(+e.target.value)} style={SEL}>
                        {HOURS.filter((h) => h > breakStartH && h < endH).map((h) => (
                          <option key={h} value={h}>{fmtHourOpt(h)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ ...LBL, marginBottom: 0 }}>Break duration</label>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.bg }}>
                        {breakDurMin >= 60 ? `${(breakDurMin / 60).toFixed(breakDurMin % 60 === 0 ? 0 : 1)}h` : `${breakDurMin}m`}
                      </span>
                    </div>
                    <input
                      type="range" min={15} max={120} step={15} value={breakDurMin}
                      onChange={(e) => setBreakDurMin(Number(e.target.value))}
                      style={{ width: "100%", accentColor: c.bg, cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
                      {["15m", "30m", "45m", "1h", "1.5h", "2h"].map((l) => <span key={l}>{l}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--muted)", fontSize: 12 }}>
            <Clock size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{timeDisplay()}</span>
            <span style={{ marginLeft: "auto", color: "var(--muted-foreground)", fontWeight: 500, flexShrink: 0 }}>
              {workedHours.toFixed(1)}h
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={submit}
              style={{
                flex: 1, padding: "9px", background: c.bg, color: "rgba(255,255,255,0.95)",
                border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              {labels.addShift}
            </button>
            <button
              onClick={onClose}
              style={{ padding: "9px 14px", background: "var(--muted)", color: "var(--foreground)", border: "none", borderRadius: 9, fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
