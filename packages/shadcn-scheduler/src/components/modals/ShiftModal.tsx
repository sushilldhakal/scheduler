import React from "react"
import type { Shift, Category } from "../../types"
import { useSchedulerContext } from "../../context"
import { fmt12 } from "../../constants"

interface ShiftModalProps {
  shift: Shift | null
  category: Category | null
  onClose: () => void
  onPublish: (shiftId: string) => void
  onUnpublish: (shiftId: string) => void
}

export function ShiftModal({
  shift,
  category,
  onClose,
  onPublish,
  onUnpublish,
}: ShiftModalProps): JSX.Element | null {
  const { getColor, labels } = useSchedulerContext()
  if (!shift || !category) return null

  const c = getColor(category.colorIdx)
  const isDraft = shift.status === "draft"

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
  }

  const handlePublish = (): void => {
    onPublish(shift.id)
    onClose()
  }

  const handleUnpublish = (): void => {
    onUnpublish(shift.id)
    onClose()
  }

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
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={handleModalClick}
        style={{
          background: "hsl(var(--background))",
          borderRadius: 16,
          padding: "24px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          minWidth: 280,
          maxWidth: 360,
          borderTop: `4px solid ${c.bg}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: c.bg,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {category.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: isDraft ? "hsl(var(--accent))" : "hsl(var(--accent))",
              borderRadius: 20,
              padding: "3px 10px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isDraft ? "hsl(var(--primary))" : "hsl(var(--primary))",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isDraft ? "hsl(var(--accent-foreground))" : "hsl(var(--primary))",
              }}
            >
              {isDraft ? labels.draft : labels.published}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: "hsl(var(--foreground))", marginBottom: 4 }}>
          {shift.employee}
        </div>
        <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
          {shift.date.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginTop: 2, fontWeight: 600 }}>
          {fmt12(shift.startH)} – {fmt12(shift.endH)} · {shift.endH - shift.startH}h
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {isDraft ? (
            <button
              onClick={handlePublish}
              style={{
                flex: 1,
                padding: "9px",
                background: "hsl(var(--primary))",
                color: "hsl(var(--background))",
                border: "none",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✓ {labels.publish}
            </button>
          ) : (
            <button
              onClick={handleUnpublish}
              style={{
                flex: 1,
                padding: "9px",
                background: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                border: "none",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Revert to {labels.draft}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              background: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
