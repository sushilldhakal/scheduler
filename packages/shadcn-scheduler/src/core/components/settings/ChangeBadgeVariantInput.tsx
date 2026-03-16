import React from "react"
import type { BadgeVariant } from "../../types"
import { cn } from "../../lib/utils"

interface ChangeBadgeVariantInputProps {
  value: BadgeVariant
  onChange: (v: BadgeVariant) => void
  label?: string
  className?: string
}

const OPTIONS: { value: BadgeVariant; label: string; description: string }[] = [
  { value: "drag", label: "Drag & drop", description: "Drag shifts only, no resize" },
  { value: "resize", label: "Resizable", description: "Resize shifts only, no drag" },
  { value: "both", label: "Both", description: "Drag and resize shifts" },
]

export function ChangeBadgeVariantInput({
  value,
  onChange,
  label = "Shift badge style",
  className,
}: ChangeBadgeVariantInputProps): React.ReactElement {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
            title={opt.description}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
