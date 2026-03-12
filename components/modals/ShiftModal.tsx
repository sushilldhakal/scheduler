import React from "react"
import type { Shift, Role } from "../../../types"
import { rc, fmt12 } from "../../../constants"

interface ShiftModalProps {
  shift: Shift | null
  role: Role | null
  onClose: () => void
  onPublish: (shiftId: string) => void
  onUnpublish: (shiftId: string) => void
}

export function ShiftModal({ shift, role, onClose, onPublish, onUnpublish }: ShiftModalProps): JSX.Element | null {
  if (!shift || !role) return null

  const c       = rc(role.colorIdx)
  const isDraft = shift.status === "draft"

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose()
    }
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
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
    >
      <div
        onClick={handleModalClick}
        style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", minWidth: 280, maxWidth: 360, borderTop: `4px solid ${c.bg}` }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.bg, textTransform: "uppercase", letterSpacing: 1 }}>
            {role.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: isDraft ? "#fef9c3" : "#dcfce7", borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isDraft ? "#eab308" : "#22c55e" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: isDraft ? "#854d0e" : "#166534" }}>
              {isDraft ? "DRAFT" : "PUBLISHED"}
            </span>
          </div>
        </div>

        {/* Shift info */}
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>{shift.employee}</div>
        <div style={{ fontSize: 13, color: "#555" }}>
          {shift.date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 2, fontWeight: 600 }}>
          {fmt12(shift.startH)} – {fmt12(shift.endH)} · {shift.endH - shift.startH}h
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {isDraft ? (
            <button
              onClick={handlePublish}
              style={{ flex: 1, padding: "9px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              ✓ Publish
            </button>
          ) : (
            <button
              onClick={handleUnpublish}
              style={{ flex: 1, padding: "9px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Revert to Draft
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: "9px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}