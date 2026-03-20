import React, { useMemo } from "react"
import { useSchedulerContext } from "../context"
import type { Block, HistogramConfig } from "../types"

interface ResourceHistogramProps {
  shifts: Block[]
  /** Visible date range — only shifts within this window are counted */
  rangeStart: Date
  rangeEnd: Date
  height?: number
  config?: HistogramConfig
}

function ResourceHistogramInner({
  shifts,
  rangeStart,
  rangeEnd,
  height = 120,
  config,
}: ResourceHistogramProps): React.ReactElement | null {
  const { categories, employees, getColor, settings } = useSchedulerContext()

  const rowMode = settings.rowMode ?? "category"
  const capacityMap: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {}
    config?.capacities?.forEach((c) => { m[c.resourceId] = c.hours })
    return m
  }, [config?.capacities])

  // Build rows: in individual mode one bar per employee, else one per category
  const rows = useMemo(() => {
    const rangeStartISO = rangeStart.toISOString().slice(0, 10)
    const rangeEndISO   = rangeEnd.toISOString().slice(0, 10)

    const inRange = (date: string) => date >= rangeStartISO && date <= rangeEndISO

    if (rowMode === "individual") {
      return employees.map((emp) => {
        const empShifts = shifts.filter(
          (s) => s.employeeId === emp.id && inRange(s.date)
        )
        const hours = empShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
        const cat = categories.find((c) => c.id === emp.categoryId)
        const color = cat ? getColor(cat.colorIdx).bg : "var(--primary)"
        return { id: emp.id, label: emp.name, hours, color, capacity: capacityMap[emp.id] }
      })
    }

    return categories.map((cat) => {
      const catShifts = shifts.filter(
        (s) => s.categoryId === cat.id && inRange(s.date)
      )
      const hours = catShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
      const color = getColor(cat.colorIdx).bg
      return { id: cat.id, label: cat.name, hours, color, capacity: capacityMap[cat.id] }
    })
  }, [rowMode, employees, categories, shifts, rangeStart, rangeEnd, getColor, capacityMap])

  const maxHours = useMemo(
    () => Math.max(1, ...rows.map((r) => Math.max(r.hours, r.capacity ?? 0))),
    [rows]
  )

  if (rows.length === 0) return null

  const BAR_H = 18
  const LABEL_W = 120
  const PADDING = 10
  const innerH = height - PADDING * 2

  return (
    <div
      style={{
        height,
        borderTop: "1px solid var(--border)",
        background: "var(--muted)",
        overflowY: "auto",
        overflowX: "hidden",
        padding: `${PADDING}px 12px`,
        flexShrink: 0,
      }}
      aria-label="Resource utilisation histogram"
    >
      {/* Header */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "var(--muted-foreground)",
          marginBottom: 8,
        }}
      >
        Resource Utilisation
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((row) => {
          const pct = Math.min(row.hours / maxHours, 1)
          const capPct = row.capacity != null ? Math.min(row.capacity / maxHours, 1) : null

          // Colour logic: always use category colour as base.
          // When capacity is configured, adjust opacity/glow to signal utilisation level.
          // Never replace the category colour with generic red/green — keeps visual identity.
          let barColor = row.color
          let barOpacity = 0.85
          let overCapacity = false
          if (row.capacity != null && row.capacity > 0) {
            const util = row.hours / row.capacity
            if (util > 1) {
              overCapacity = true
              barOpacity = 1
            } else if (util >= 0.9) {
              barOpacity = 0.95
            } else {
              barOpacity = 0.7
            }
          }

          return (
            <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Label */}
              <div
                style={{
                  width: LABEL_W,
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={row.label}
              >
                {row.label}
              </div>

              {/* Bar track */}
              <div
                style={{
                  flex: 1,
                  height: BAR_H,
                  background: "var(--background)",
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Fill bar */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${pct * 100}%`,
                    background: barColor,
                    borderRadius: 4,
                    transition: "width 0.3s ease",
                    opacity: barOpacity,
                  }}
                />
                {/* Over-capacity indicator — red right border */}
                {overCapacity && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: "var(--destructive)",
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
                )}
                {/* Capacity marker line */}
                {capPct != null && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${capPct * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: "var(--foreground)",
                      opacity: 0.4,
                    }}
                    title={`Capacity: ${row.capacity}h`}
                  />
                )}
                {/* Hours label inside bar */}
                <div
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: pct > 0.5 ? "rgba(255,255,255,0.9)" : "var(--muted-foreground)",
                    pointerEvents: "none",
                  }}
                >
                  {row.hours.toFixed(1)}h
                  {row.capacity != null && (
                    <span style={{ opacity: 0.7, marginLeft: 2 }}>/ {row.capacity}h</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ResourceHistogram = React.memo(ResourceHistogramInner)
