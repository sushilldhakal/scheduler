import React from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import type { Block, Resource, FlatRow, SchedulerSlots } from "../types"
import { useSchedulerContext } from "../context"
import type { Virtualizer } from "@tanstack/react-virtual"
import type { StaffPanelState, AddPromptState } from "./GridView"

export interface GridViewSidebarProps {
  // Layout
  sidebarCollapsed: boolean
  sidebarWidth: number
  setSidebarWidth: (w: number) => void
  toggleSidebar: () => void
  HOUR_HDR_H: number
  ROLE_HDR: number

  // Sort
  sortBy: "name" | "hours" | "scheduled" | null
  sortDir: "asc" | "desc"
  toggleSort: (col: "name" | "hours" | "scheduled") => void

  // Rows — we receive flatRows + per-row heights to build normal-flow rows
  flatRows: FlatRow[]
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  sidebarScrollRef: React.RefObject<HTMLDivElement>

  // Data
  ALL_EMPLOYEES: Resource[]
  baseShifts: Block[]
  isWeekView: boolean
  isDayViewMultiDay?: boolean
  focusedDate: Date | undefined
  dates: Date[]
  selEmps: Set<string>

  // Interaction
  collapsed: Set<string>
  toggleCollapse: (id: string) => void
  hoveredCategoryId: string | null
  setStaffPanel: React.Dispatch<React.SetStateAction<StaffPanelState | null>>
  setAddPrompt: React.Dispatch<React.SetStateAction<AddPromptState | null>>
  slots: SchedulerSlots
}

export function GridViewSidebar({
  sidebarCollapsed,
  sidebarWidth,
  setSidebarWidth,
  toggleSidebar,
  HOUR_HDR_H,
  ROLE_HDR,
  sortBy,
  sortDir,
  toggleSort,
  flatRows,
  rowVirtualizer,
  sidebarScrollRef,
  ALL_EMPLOYEES,
  baseShifts,
  isWeekView,
  isDayViewMultiDay,
  focusedDate,
  dates,
  selEmps,
  collapsed,
  toggleCollapse,
  hoveredCategoryId,
  setStaffPanel,
  setAddPrompt,
  slots,
}: GridViewSidebarProps): React.ReactElement {
  const { labels, getColor } = useSchedulerContext()

  // Compute base shifts for the visible date window
  const visibleShifts = React.useMemo(() => {
    const refDate = focusedDate ?? dates[0]
    if (!refDate) return baseShifts.filter(s => selEmps.has(s.employeeId))
    if (isWeekView) {
      const dow = refDate.getDay()
      const weekStart = new Date(refDate)
      weekStart.setDate(refDate.getDate() - (dow === 0 ? 6 : dow - 1))
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      const s = weekStart.toISOString().slice(0, 10)
      const e = weekEnd.toISOString().slice(0, 10)
      return baseShifts.filter(sh => selEmps.has(sh.employeeId) && sh.date >= s && sh.date <= e)
    }
    const iso = refDate.toISOString().slice(0, 10)
    return baseShifts.filter(sh => sh.date === iso && selEmps.has(sh.employeeId))
  }, [baseShifts, isWeekView, focusedDate, dates, selEmps])

  // Build per-row heights from virtualizer so our normal-flow rows match grid exactly
  const rowHeights = React.useMemo(() => {
    const map: Record<string, number> = {}
    rowVirtualizer.getVirtualItems().forEach(vr => {
      const row = flatRows[vr.index]
      if (row) map[row.key] = vr.size
    })
    return map
  }, [rowVirtualizer, flatRows])

  return (
    <>
      {/* Sidebar panel */}
      <div
        style={{
          width: sidebarCollapsed ? 0 : sidebarWidth,
          minWidth: sidebarCollapsed ? 0 : sidebarWidth,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 150ms ease, min-width 150ms ease",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRight: "1px solid var(--border)",
            background: "var(--muted)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Sticky top header — sort controls */}
          <div style={{
            flexShrink: 0,
            height: HOUR_HDR_H,
            background: "var(--muted)",
            borderBottom: "2px solid var(--border)",
            zIndex: 21,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 8px 6px",
            gap: 4,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.8, paddingLeft: 2 }}>
              {labels.category ?? "Resources"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {(["name", "hours", "scheduled"] as const).map((col) => {
                const colLabel = col === "name" ? labels.category ?? "Category" : col === "hours" ? "Hours" : "Shifts"
                const isActive = sortBy === col
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleSort(col)}
                    style={{
                      fontSize: 9, fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                      textTransform: "uppercase", letterSpacing: 0.5,
                      background: isActive ? "var(--background)" : "transparent",
                      border: isActive ? "1px solid var(--border)" : "1px solid transparent",
                      cursor: "pointer", padding: "2px 6px", borderRadius: 4,
                      display: "flex", alignItems: "center", gap: 2,
                      flexShrink: col === "name" ? 1 : 0, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      transition: "background 100ms, color 100ms, border-color 100ms",
                    }}
                    onPointerEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--accent)" }}
                    onPointerLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
                  >
                    {colLabel}
                    <span style={{ fontSize: 8, opacity: isActive ? 1 : 0.5, marginLeft: 1 }}>
                      {isActive ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/*
            Scrollable rows container — overflow-y:auto scrollbar hidden.
            scrollTop synced to grid in GridView scroll handler.
            Category rows use position:sticky top:0 — they stack just like
            the CodePen approach: normal flow + sticky = free stacking.
          */}
          <div
            ref={sidebarScrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none",
            } as React.CSSProperties}
          >
            {flatRows.map((row) => {
              const cat = row.category
              const emp = row.employee
              const c = getColor(cat.colorIdx)
              const rowH = rowHeights[row.key] ?? ROLE_HDR

              // ── Category header — position:sticky top:0, stacks naturally ──
              if (row.kind === "category") {
                const catShifts = visibleShifts.filter(s => s.categoryId === cat.id)
                const scheduled = catShifts.length
                const totalHours = catShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
                const staffCount = ALL_EMPLOYEES.filter(e => e.categoryId === cat.id).length
                const hoursCapacity = 40
                const hoursPercent = Math.min(100, (totalHours / hoursCapacity) * 100)
                const isOverCapacity = totalHours > hoursCapacity

                return (
                  <div
                    key={row.key}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 4,
                      height: rowH,
                      flexShrink: 0,
                      borderBottom: `1px solid ${c.bg}25`,
                      background: hoveredCategoryId === cat.id ? `${c.bg}14` : `${c.bg}07`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      overflow: "hidden",
                      transition: "background 80ms ease",
                    }}
                  >
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: c.bg, borderRadius: "0 2px 2px 0" }} />
                    <div style={{ height: ROLE_HDR, display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 8, gap: 6 }}>
                      {slots.resourceHeader ? (
                        slots.resourceHeader({
                          resource: cat,
                          scheduledCount: scheduled,
                          isCollapsed: collapsed.has(cat.id),
                          onToggleCollapse: () => toggleCollapse(cat.id),
                        })
                      ) : (
                        <>
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                              {cat.name}
                            </span>
                            <span style={{ fontSize: 10, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>
                              {staffCount} staff
                              {scheduled > 0 ? ` · ${scheduled} shift${scheduled !== 1 ? "s" : ""}` : ""}
                              {totalHours > 0 ? ` · ${totalHours.toFixed(1)}h` : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCollapse(cat.id)}
                            aria-label={collapsed.has(cat.id) ? "Expand" : "Collapse"}
                            style={{
                              border: "none", background: "transparent", cursor: "pointer",
                              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                              color: "var(--muted-foreground)",
                              transform: collapsed.has(cat.id) ? "rotate(-90deg)" : "none",
                              transition: "transform 0.2s", flexShrink: 0, borderRadius: 4,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setStaffPanel(p => p?.categoryId === cat.id ? null : { categoryId: cat.id, anchorRect: rect })
                            }}
                            style={{
                              fontSize: 10, fontWeight: 600, color: c.text, background: c.light,
                              border: `1px solid ${c.border}`, borderRadius: 5,
                              padding: "3px 7px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                            }}
                          >
                            {labels.staff}
                          </button>
                        </>
                      )}
                    </div>
                    <div style={{ padding: "0 14px 5px", flexShrink: 0 }}>
                      <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 2,
                          background: isOverCapacity ? "var(--destructive)" : c.bg,
                          width: `${hoursPercent}%`,
                          transition: "width 300ms ease",
                        }} />
                      </div>
                    </div>
                  </div>
                )
              }

              // ── Employee row — normal flow, fixed height ──
              const empShifts = visibleShifts.filter(s => s.categoryId === cat.id && s.employeeId === emp!.id)
              const empHours = empShifts.reduce((sum, s) => sum + (s.endH - s.startH), 0)
              const initials = emp!.name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
              return (
                <div
                  key={row.key}
                  style={{
                    height: rowH,
                    flexShrink: 0,
                    borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                    background: hoveredCategoryId === cat.id ? `${c.bg}0d` : "var(--background)",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 14,
                    paddingRight: 8,
                    gap: 8,
                    overflow: "hidden",
                    transition: "background 80ms ease",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `${c.bg}20`,
                    border: `1.5px solid ${c.bg}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: c.bg, flexShrink: 0,
                  }}>
                    {emp!.avatar && !emp!.avatar.match(/^[A-Z]{1,2}$/) ? (
                      <img src={emp!.avatar} alt={emp!.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.display = "none" }} />
                    ) : initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {emp!.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {empShifts.length} shift{empShifts.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {empHours > 0 && (
                    <div style={{
                      fontSize: 10, fontWeight: 600, flexShrink: 0,
                      color: empHours > 40 ? "var(--destructive)" : c.text,
                      background: empHours > 40 ? "color-mix(in srgb, var(--destructive) 10%, transparent)" : c.light,
                      padding: "2px 6px", borderRadius: 4,
                    }}>
                      {empHours.toFixed(0)}h
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div
        style={{ width: 4, flexShrink: 0, cursor: "col-resize", background: "transparent", position: "relative", zIndex: 30 }}
        onPointerDown={(e) => {
          e.preventDefault()
          const startX = e.clientX
          const startW = sidebarWidth
          const onMove = (mv: PointerEvent) => setSidebarWidth(Math.max(120, Math.min(400, startW + mv.clientX - startX)))
          const onUp = () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp) }
          document.addEventListener("pointermove", onMove)
          document.addEventListener("pointerup", onUp)
        }}
      >
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 1, width: 2, background: "var(--border)" }} />
      </div>

      {/* Collapse toggle */}
      <div style={{
        position: "absolute", top: "50%", left: sidebarCollapsed ? 2 : sidebarWidth - 1,
        transform: "translateY(-50%)", zIndex: 40,
        transition: "left 150ms ease", pointerEvents: "auto",
      }}>
        <button
          onClick={toggleSidebar}
          style={{
            width: 16, height: 28, borderRadius: "0 4px 4px 0",
            background: "var(--background)", border: "1px solid var(--border)", borderLeft: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "1px 0 4px rgba(0,0,0,0.1)", color: "var(--muted-foreground)", padding: 0,
            transition: "color 120ms, background 120ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--background)"; e.currentTarget.style.color = "var(--muted-foreground)" }}
        >
          {sidebarCollapsed ? <ChevronsRight size={10} /> : <ChevronsLeft size={10} />}
        </button>
      </div>
    </>
  )
}
