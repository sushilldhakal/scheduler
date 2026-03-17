import React from "react"
import type { Block, Resource } from "../../types"
import { useSchedulerContext } from "../../context"
import { fmt12 } from "../../constants"

interface DayShiftsDialogProps {
  date: Date
  shifts: Block[]
  categoryMap: Record<string, Resource>
  onClose: () => void
  onShiftClick?: (block: Block, resource: Resource) => void
}

export function DayShiftsDialog({
  date,
  shifts,
  categoryMap,
  onClose,
  onShiftClick,
}: DayShiftsDialogProps): React.ReactElement {
  const { getColor } = useSchedulerContext()

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  const byCategory = React.useMemo(() => {
    const map: Record<string, Block[]> = {}
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="min-w-[320px] max-w-[420px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-xl"
      >
        <div className="mb-1 text-[15px] font-extrabold text-foreground">
          {dateStr}
        </div>
        <div className="mb-4 text-xs text-muted-foreground">
          {shifts.length} shift{shifts.length !== 1 ? "s" : ""}
        </div>
        <div className="flex flex-col gap-4">
          {Object.entries(byCategory).map(([categoryId, catShifts]) => {
            const cat = categoryMap[categoryId]
            if (!cat) return null
            const c = getColor(cat.colorIdx)
            return (
              <div key={categoryId}>
                <div
                  className="mb-2 flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: c.text }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.bg }}
                  />
                  {cat.name}
                </div>
                <div className="flex flex-col gap-1">
                  {catShifts.map((shift) => {
                    const isDraft = shift.status === "draft"
                    return (
                      <div
                        key={shift.id}
                        onClick={() => onShiftClick?.(shift, cat)}
                        className="rounded-lg px-3 py-2 text-[13px] font-semibold"
                        style={{
                          background: isDraft ? c.light : c.bg,
                          color: isDraft ? c.text : "var(--background)",
                          border: isDraft ? `1.5px dashed ${c.border}` : "none",
                          cursor: onShiftClick ? "pointer" : "default",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {isDraft && "✎ "}
                            {shift.employee}
                          </span>
                          <span className="text-xs opacity-90">
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
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-muted px-4 py-2.5 text-[13px] font-semibold text-foreground"
        >
          Close
        </button>
      </div>
    </div>
  )
}
