import React from "react"
import type { Resource } from "../../types"
import { useSchedulerContext } from "../../context"
import { AlertTriangle } from "lucide-react"

interface CategoryWarningModalProps {
  emp: Resource | null
  fromCategory: Resource
  toCategory: Resource
  onConfirm: () => void
  onCancel: () => void
}

export function RoleWarningModal({
  emp,
  fromCategory,
  toCategory,
  onConfirm,
  onCancel,
}: CategoryWarningModalProps): React.ReactElement | null {
  const { getColor, labels } = useSchedulerContext()
  if (!emp) return null

  const fc = getColor(fromCategory.colorIdx)
  const tc = getColor(toCategory.colorIdx)

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onCancel()
  }

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={handleModalClick}
        style={{
          background: "var(--background)",
          borderRadius: 14,
          padding: "22px 24px",
          maxWidth: 360,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          borderTop: "4px solid var(--primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={16} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--foreground)" }}>
            {labels.category} Mismatch
          </span>
        </div>

        <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5, margin: "0 0 6px" }}>
          <strong>{emp.name}</strong> is assigned to{" "}
          <span style={{ color: fc.bg, fontWeight: 700 }}>{fromCategory.name}</span>. You're
          moving this shift to{" "}
          <span style={{ color: tc.bg, fontWeight: 700 }}>{toCategory.name}</span>.
        </p>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 18px" }}>
          This is allowed as fill-in cover. The shift {labels.category.toLowerCase()} will be
          updated.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "9px",
              background: "var(--primary)",
              color: "var(--background)",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Move Anyway
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 14px",
              background: "var(--border))",
              color: "var(--foreground)",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
