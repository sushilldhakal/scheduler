import React, { useMemo, useState } from "react"
import type { Block, Resource } from "../../types"
import { useSchedulerContext } from "../../context"
import { Calendar } from "../ui/calendar"
import { HOURS, SNAP, toDateISO, parseBlockDate } from "../../constants"
import { findConflicts } from "../../utils/packing"

interface ShiftModalProps {
  shift: Block | null
  category: Resource | null
  onClose: () => void
  onPublish: (shiftId: string) => void
  onUnpublish: (shiftId: string) => void
  onDelete?: (shiftId: string) => void
  /** When "sheet", renders only the content (for use inside BottomSheet on mobile). */
  variant?: "modal" | "sheet"
  /** All shifts, used to compute conflicts for this shift. */
  allShifts?: Block[]
  /** Called when the user saves edits to date/time/category. */
  onUpdate?: (updated: Block) => void
}

export function ShiftModal({
  shift,
  category,
  onClose,
  onPublish,
  onUnpublish,
  onDelete,
  variant = "modal",
  allShifts,
  onUpdate,
}: ShiftModalProps): React.ReactElement | null {
  if (!shift || !category) return null
  const { getColor, labels, categories, settings, getTimeLabel } = useSchedulerContext()

  const c = getColor(category.colorIdx)
  const isDraft = shift.status === "draft"

  const [draft, setDraft] = useState<Block>(shift)
  const [errors, setErrors] = useState<{ date?: string; startH?: string; endH?: string }>({})

  const hourOptions: number[] = useMemo(() => {
    const from = settings.visibleFrom
    const to = settings.visibleTo
    const step = SNAP || 0.5
    const count = Math.round((to - from) / step)
    const out: number[] = []
    for (let i = 0; i <= count; i++) {
      const h = from + i * step
      if (h >= from && h <= to) out.push(Number(h.toFixed(2)))
    }
    // options aligned with visible range and SNAP
    return out
  }, [settings.visibleFrom, settings.visibleTo])

  const overlaps: Block[] = useMemo(() => {
    if (!allShifts) return []
    const next = allShifts.map((b) => (b.id === draft.id ? draft : b))
    const conflictIds = findConflicts(next)
    if (!conflictIds.has(draft.id)) return []
    return next.filter(
      (b) =>
        b.id !== draft.id &&
        b.employeeId === draft.employeeId &&
        b.date === draft.date &&
        b.startH < draft.endH &&
        b.endH > draft.startH
    )
  }, [allShifts, draft])

  const hasConflict = overlaps.length > 0

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation()
  }

  const handlePublish = (): void => {
    if (hasConflict) return
    onPublish(draft.id)
    onClose()
  }

  const handleUnpublish = (): void => {
    onUnpublish(draft.id)
    onClose()
  }

  const validate = (next: Block): boolean => {
    const nextErrors: typeof errors = {}
    if (!next.date) {
      nextErrors.date = "Date is required."
    }
    if (!(next.startH < next.endH)) {
      nextErrors.startH = "Start time must be before end time."
      nextErrors.endH = "End time must be after start time."
    }
    if (next.startH < settings.visibleFrom || next.endH > settings.visibleTo) {
      nextErrors.startH = `Time must be between ${getTimeLabel(draft.date, settings.visibleFrom)} and ${getTimeLabel(draft.date, settings.visibleTo)}.`
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = (): void => {
    if (!onUpdate) {
      onClose()
      return
    }
    const next = draft
    if (!validate(next)) return
    onUpdate(next)
    onClose()
  }

  const content = (
    <div
      onClick={variant === "modal" ? handleModalClick : undefined}
      style={{
        background: "var(--background)",
        borderRadius: variant === "sheet" ? 0 : 16,
        padding: "24px 28px",
        boxShadow: variant === "modal" ? "0 24px 64px rgba(0,0,0,0.22)" : undefined,
        minWidth: variant === "modal" ? 280 : undefined,
        maxWidth: variant === "modal" ? 360 : undefined,
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
              background: isDraft ? "var(--accent)" : "var(--accent)",
              borderRadius: 20,
              padding: "3px 10px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isDraft ? "var(--primary)" : "var(--primary)",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isDraft ? "var(--accent-foreground)" : "var(--primary)",
              }}
            >
              {isDraft ? labels.draft : labels.published}
            </span>
          </div>
        </div>

        {hasConflict && overlaps.length > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--destructive)",
              background: "(var(--destructive)/0.04)",
              fontSize: 12,
              color: "var(--destructive-foreground)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              This shift overlaps with {overlaps.length} other shift
              {overlaps.length !== 1 ? "s" : ""}. Resolve the conflict to publish.
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {overlaps.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    background: "var(--background)",
                    border: "1px solid var(--border))",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {getTimeLabel(b.date, b.startH)} – {getTimeLabel(b.date, b.endH)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                    Category: {b.categoryId} · Status: {b.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", marginBottom: 4 }}>
          {draft.employee}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
          {new Date(draft.date + "T12:00:00").toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Date picker */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--muted-foreground)" }}>
              Date
            </div>
            <Calendar
              mode="single"
              selected={parseBlockDate({ date: draft.date })}
              onSelect={(d) => {
                if (!d) return
                const next: Block = { ...draft, date: toDateISO(d) }
                setDraft(next)
                validate(next)
              }}
            />
            {errors.date && (
              <div style={{ fontSize: 11, color: "var(--destructive)", marginTop: 4 }}>
                {errors.date}
              </div>
            )}
          </div>

          {/* Time + duration */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--muted-foreground)" }}>
              Time
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={draft.startH}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  const nextEnd = Math.max(v + SNAP, draft.endH)
                  const next: Block = { ...draft, startH: v, endH: nextEnd }
                  setDraft(next)
                  validate(next)
                }}
                style={{ flex: 1, padding: "4px 8px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border))" }}
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h}>
                    {getTimeLabel(draft.date, h)}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>to</span>
              <select
                value={draft.endH}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  const next: Block = { ...draft, endH: v }
                  setDraft(next)
                  validate(next)
                }}
                style={{ flex: 1, padding: "4px 8px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border))" }}
              >
                {hourOptions
                  .filter((h) => h > draft.startH)
                  .map((h) => (
                    <option key={h} value={h}>
                      {getTimeLabel(draft.date, h)}
                    </option>
                  ))}
              </select>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
              {getTimeLabel(draft.date, draft.startH)} – {getTimeLabel(draft.date, draft.endH)} · {draft.endH - draft.startH}h
            </div>
            {(errors.startH || errors.endH) && (
              <div style={{ fontSize: 11, color: "var(--destructive)", marginTop: 4 }}>
                {errors.startH || errors.endH}
              </div>
            )}
          </div>

          {/* Category selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--muted-foreground)" }}>
              Category
            </div>
            <select
              value={draft.categoryId}
              onChange={(e) => {
                const next: Block = { ...draft, categoryId: e.target.value }
                setDraft(next)
                validate(next)
              }}
              style={{ width: "100%", padding: "4px 8px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border))" }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
          {isDraft ? (
            <button
              onClick={handlePublish}
              style={{
                flex: 1,
                minWidth: 80,
                padding: "9px",
                background: hasConflict ? "var(--muted))" : "var(--primary)",
                color: hasConflict
                  ? "var(--muted-foreground)"
                  : "var(--primary-foreground)",
                border: "none",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: hasConflict ? "not-allowed" : "pointer",
              }}
              disabled={hasConflict}
            >
              ✓ {labels.publish}
            </button>
          ) : (
            <button
              onClick={handleUnpublish}
              style={{
                flex: 1,
                minWidth: 80,
                padding: "9px",
                background: "var(--border))",
                color: "var(--foreground)",
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
          {onDelete && (
            <button
              onClick={() => {
                onDelete(shift.id)
                onClose()
              }}
              style={{
                padding: "9px 14px",
                background: "var(--destructive)",
                color: "var(--destructive-foreground)",
                border: "none",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            style={{
              padding: "9px 16px",
              background: "var(--border))",
              color: "var(--foreground)",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
  )

  if (variant === "sheet") return content

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
      {content}
    </div>
  )
}
