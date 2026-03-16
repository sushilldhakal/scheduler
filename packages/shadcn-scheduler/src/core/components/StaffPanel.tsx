import React, { useRef, useEffect } from "react"
import type { Resource, Block } from "../types"
import { useSchedulerContext } from "../context"

interface StaffPanelProps {
  category: Resource
  date: Date
  dayShifts: Block[]
  onDragStaff: (empId: string, categoryId: string) => void
  anchorRect: DOMRect | null
  onClose: () => void
}

export function StaffPanel({
  category,
  date,
  dayShifts,
  onDragStaff,
  anchorRect,
  onClose,
}: StaffPanelProps): JSX.Element | null {
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

  if (!anchorRect) return null

  const handleDragStart =
    (emp: (typeof employees)[0]) => (e: React.DragEvent<HTMLDivElement>): void => {
      e.dataTransfer.setData("empId", emp.id)
      e.dataTransfer.setData("categoryId", category.id)
      onDragStaff(emp.id, category.id)
    }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.background = "hsl(var(--accent))"
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.background = "transparent"
  }

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        zIndex: 8888,
        background: "hsl(var(--background))",
        border: `1.5px solid ${c.bg}30`,
        borderRadius: 10,
        boxShadow: "0 8px 32px hsl(var(--foreground) / 0.12)",
        minWidth: 190,
        maxHeight: 240,
        overflowY: "auto",
        padding: "6px 0",
      }}
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
        }}
      >
        Drag to schedule · {category.name}
      </div>

      {unscheduled.length === 0 && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
          All {labels.staff.toLowerCase()} scheduled
        </div>
      )}

      {unscheduled.map((emp) => (
        <div
          key={emp.id}
          draggable
          onDragStart={handleDragStart(emp)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            cursor: "grab",
            userSelect: "none",
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
          <span style={{ fontSize: 12, fontWeight: 500, color: "hsl(var(--foreground))" }}>{emp.name}</span>
          <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginLeft: "auto" }}>drag →</span>
        </div>
      ))}
    </div>
  )
}
