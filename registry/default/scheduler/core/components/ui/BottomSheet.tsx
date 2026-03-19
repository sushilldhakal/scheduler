import React, { useEffect } from "react"

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Optional title or handle bar area */
  title?: React.ReactNode
}

/**
 * Bottom sheet for mobile: slides up from bottom with backdrop.
 * Use for block detail on viewports < 768px.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  title,
}: BottomSheetProps): React.ReactElement | null {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "85vh",
          background: "var(--background)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {title !== undefined && (
          <div
            style={{
              flexShrink: 0,
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {title}
          </div>
        )}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
