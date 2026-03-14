import React from "react"
import { fmt12 } from "../../constants"
import { cn } from "../../lib/utils"

interface ChangeVisibleHoursInputProps {
  visibleFrom: number
  visibleTo: number
  onChange: (visibleFrom: number, visibleTo: number) => void
  label?: string
  className?: string
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)

export function ChangeVisibleHoursInput({
  visibleFrom,
  visibleTo,
  onChange,
  label = "Visible hours",
  className,
}: ChangeVisibleHoursInputProps): JSX.Element {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <select
          value={visibleFrom}
          onChange={(e) => onChange(Number(e.target.value), visibleTo)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {fmt12(h)}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">to</span>
        <select
          value={visibleTo}
          onChange={(e) => onChange(visibleFrom, Number(e.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {fmt12(h)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
