import React, { useRef, useEffect } from "react"
import type { Resource, Block } from "../types"
import { useSchedulerContext } from "../context"

interface StaffPanelProps {
  category: Resource
  date: Date
  dayShifts: Block[]
  onDragStaff: (args: { empId: string; categoryId: string; empName: string; pointerId: number }) => void
  anchorRect: DOMRect | null
  onClose: () => void
  /** When "drawer", render as slide-in panel from right (tablet). */
  variant?: "popover" | "drawer"
}

export function StaffPanel({
  category,
  date,
  dayShifts,
  onDragStaff,
  anchorRect,
  onClose,
  variant = "popover",
}: StaffPanelProps): React.ReactElement | null {
  const { employees, getColor, labels } = useSchedulerContext()
  const scheduledIds = new Set(
    dayShifts.filter((s) => s.categoryId === category.id).map((s) => s.employeeId)
  )
  const unscheduled = employees.filter(
    (e) => e.categoryId === category.id && !scheduledIds.has(e.id)
  )
  const c = getColor(category.colorIdx)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener("mousedown", h), 0)
    return () => document.removeEventListener("mousedown", h)
  }, [onClose])

  if (variant === "popover" && !anchorRect) return null

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.background = "var(--accent)"
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.background = "transparent"
  }

  const isDrawer = variant === "drawer"
  return (
    <div
      ref={ref}
      style={
        isDrawer
          ? {
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 280,
              zIndex: 8888,
              background: "var(--background)",
              borderLeft: `1px solid var(--border)`,
              boxShadow: "-8px 0 24px var(--sch-fg-08)",
              overflowY: "auto",
              padding: "12px 0",
            }
          : {
              position: "fixed",
              top: anchorRect!.bottom + 4,
              left: anchorRect!.left,
              zIndex: 8888,
              background: "var(--background)",
              border: `1.5px solid ${c.bg}30`,
              borderRadius: 10,
              boxShadow: "0 8px 32px var(--sch-fg-12)",
              minWidth: 190,
              maxHeight: 240,
              overflowY: "auto",
              padding: "6px 0",
            }
      }
    >
      <div
        style={{
          padding: "6px 12px 4px",
          fontSize: 10,
          fontWeight: 700,
          color: c.bg,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          borderBottom: `1px solid ${c.bg}20`,
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Drag to schedule · {category.name}</span>
        {isDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              padding: 4,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {unscheduled.length === 0 && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted-foreground)" }}>
          All {labels.staff.toLowerCase()} scheduled
        </div>
      )}

      {unscheduled.map((emp) => (
        <div
          key={emp.id}
          onPointerDown={(e) => {
            e.stopPropagation()
            // Capture pointer so we get move/up events even if the finger leaves the row.
            e.currentTarget.setPointerCapture(e.pointerId)
            onDragStaff({ empId: emp.id, categoryId: category.id, empName: emp.name, pointerId: e.pointerId })
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            cursor: "grab",
            userSelect: "none",
            touchAction: "none",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: c.light,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, color: c.text }}>{emp.avatar}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>{emp.name}</span>
          <span style={{ fontSize: 9, color: "var(--muted-foreground)", marginLeft: "auto" }}>drag →</span>
        </div>
      ))}
    </div>
  )
}
