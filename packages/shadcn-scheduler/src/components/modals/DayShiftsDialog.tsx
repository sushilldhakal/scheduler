import React from "react"
import type { Shift, Category } from "../../types"
import { useSchedulerContext } from "../../context"
import { fmt12 } from "../../constants"

interface DayShiftsDialogProps {
  date: Date
  shifts: Shift[]
  categoryMap: Record<string, Category>
  onClose: () => void
  onShiftClick?: (shift: Shift, category: Category) => void
}

export function DayShiftsDialog({
  date,
  shifts,
  categoryMap,
  onClose,
  onShiftClick,
}: DayShiftsDialogProps): JSX.Element {
  const { getColor } = useSchedulerContext()

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  const byCategory = React.useMemo(() => {
    const map: Record<string, Shift[]> = {}
    shifts.forEach((s) => {
      if (!map[s.categoryId]) map[s.categoryId] = []
      map[s.categoryId].push(s)
    })
    Object.keys(map).forEach((cid) => {
      map[cid].sort((a, b) => a.startH - b.startH)
    })
    return map
  }, [shifts])

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "hsl(var(--background))",
          borderRadius: 16,
          padding: "20px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          minWidth: 320,
          maxWidth: 420,
          maxHeight: "80vh",
          overflowY: "auto",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "hsl(var(--foreground))",
            marginBottom: 4,
          }}
        >
          {dateStr}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "hsl(var(--muted-foreground))",
            marginBottom: 16,
          }}
        >
          {shifts.length} shift{shifts.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(byCategory).map(([categoryId, catShifts]) => {
            const cat = categoryMap[categoryId]
            if (!cat) return null
            const c = getColor(cat.colorIdx)
            return (
              <div key={categoryId}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.text,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.bg,
                    }}
                  />
                  {cat.name}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {catShifts.map((shift) => {
                    const isDraft = shift.status === "draft"
                    return (
                      <div
                        key={shift.id}
                        onClick={() => onShiftClick?.(shift, cat)}
                        style={{
                          padding: "8px 12px",
                          background: isDraft ? c.light : c.bg,
                          color: isDraft ? c.text : "hsl(var(--background))",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          border: isDraft ? `1.5px dashed ${c.border}` : "none",
                          cursor: onShiftClick ? "pointer" : "default",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{isDraft && "✎ "}{shift.employee}</span>
                          <span style={{ fontSize: 12, opacity: 0.9 }}>
                            {fmt12(shift.startH)} – {fmt12(shift.endH)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            background: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
