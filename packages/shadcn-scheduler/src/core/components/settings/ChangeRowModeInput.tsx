import React from "react"
import { cn } from "../../lib/utils"
import type { RowMode } from "../../types"

interface ChangeRowModeInputProps {
  value: RowMode
  onChange: (mode: RowMode) => void
  label?: string
  className?: string
}

export function ChangeRowModeInput({
  value,
  onChange,
  label = "Row layout",
  className,
}: ChangeRowModeInputProps): React.ReactElement {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-medium text-foreground">{label}</label>
      <p className="text-[10px] text-muted-foreground">
        Category view stacks all shifts per department. Individual view shows one row per employee.
      </p>
      <div className="flex gap-2">
        {(["category", "individual"] as const).map((mode) => {
          const isActive = value === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-md border px-3 py-2.5 text-xs transition-colors",
                isActive
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
              )}
            >
              {/* Mini diagram preview */}
              {mode === "category" ? (
                <div className="flex w-full flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-10 rounded-sm bg-current opacity-60" />
                    <div className="h-1.5 w-6 rounded-sm bg-current opacity-30" />
                    <div className="h-1.5 w-8 rounded-sm bg-current opacity-30" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-10 rounded-sm bg-current opacity-60" />
                    <div className="h-1.5 w-10 rounded-sm bg-current opacity-30" />
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-0.5">
                  <div className="h-1.5 w-full rounded-sm bg-current opacity-60" />
                  <div className="flex items-center gap-1 pl-2">
                    <div className="h-1.5 w-2 rounded-full bg-current opacity-40" />
                    <div className="h-1.5 w-12 rounded-sm bg-current opacity-30" />
                  </div>
                  <div className="flex items-center gap-1 pl-2">
                    <div className="h-1.5 w-2 rounded-full bg-current opacity-40" />
                    <div className="h-1.5 w-8 rounded-sm bg-current opacity-30" />
                  </div>
                  <div className="h-1.5 w-full rounded-sm bg-current opacity-60" />
                  <div className="flex items-center gap-1 pl-2">
                    <div className="h-1.5 w-2 rounded-full bg-current opacity-40" />
                    <div className="h-1.5 w-10 rounded-sm bg-current opacity-30" />
                  </div>
                </div>
              )}
              <span>{mode === "category" ? "By category" : "By employee"}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
