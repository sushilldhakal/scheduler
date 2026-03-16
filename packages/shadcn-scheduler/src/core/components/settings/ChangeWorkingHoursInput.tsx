import React from "react"
import type { WorkingHours } from "../../types"
import { DAY_NAMES, fmt12 } from "../../constants"
import { cn } from "../../lib/utils"

interface ChangeWorkingHoursInputProps {
  workingHours: Record<number, WorkingHours | null>
  onChange: (workingHours: Record<number, WorkingHours | null>) => void
  label?: string
  className?: string
}

export function ChangeWorkingHoursInput({
  workingHours,
  onChange,
  label = "Working hours",
  className,
}: ChangeWorkingHoursInputProps): React.ReactElement {
  const updateDay = (dow: number, wh: WorkingHours | null): void => {
    onChange({ ...workingHours, [dow]: wh })
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-medium text-foreground">{label}</label>
      <p className="text-[10px] text-muted-foreground">
        Hours outside working time show dashed background (day/week view)
      </p>
      <div className="space-y-1.5">
        {([0, 1, 2, 3, 4, 5, 6] as const).map((dow) => {
            const wh = workingHours[dow] ?? null
            return (
              <div key={dow} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-xs text-muted-foreground">
                  {DAY_NAMES[dow].slice(0, 3)}
                </span>
                <select
                  value={wh === null ? "closed" : "open"}
                  onChange={(e) => {
                    if (e.target.value === "closed") {
                      updateDay(dow, null)
                    } else {
                      updateDay(dow, wh ?? { from: 9, to: 17 })
                    }
                  }}
                  className="h-7 w-16 rounded border border-input bg-background px-1 text-xs"
                >
                  <option value="closed">Closed</option>
                  <option value="open">Open</option>
                </select>
                {wh !== null && (
                  <>
                    <select
                      value={wh.from}
                      onChange={(e) =>
                        updateDay(dow, { ...wh, from: Number(e.target.value) })
                      }
                      className="h-7 w-16 rounded border border-input bg-background px-1 text-xs"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {fmt12(i)}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px]">–</span>
                    <select
                      value={wh.to}
                      onChange={(e) =>
                        updateDay(dow, { ...wh, to: Number(e.target.value) })
                      }
                      className="h-7 w-16 rounded border border-input bg-background px-1 text-xs"
                    >
                      {Array.from({ length: 25 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 24 ? "12am" : fmt12(i)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
