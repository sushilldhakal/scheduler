import React from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Block, Resource, FlatRow, SchedulerSlots } from "../types";
import { useSchedulerContext } from "../context";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { StaffPanelState, AddPromptState } from "./GridView";

export interface GridViewSidebarProps {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
  toggleSidebar: () => void;
  HOUR_HDR_H: number;
  ROLE_HDR: number;
  sortBy: "name" | "hours" | "scheduled" | null;
  sortDir: "asc" | "desc";
  toggleSort: (col: "name" | "hours" | "scheduled") => void;
  flatRows: FlatRow[];
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  totalHVirtual: number;
  ALL_EMPLOYEES: Resource[];
  baseShifts: Block[];
  isWeekView: boolean;
  isDayViewMultiDay?: boolean;
  focusedDate: Date | undefined;
  dates: Date[];
  selEmps: Set<string>;
  collapsed: Set<string>;
  toggleCollapse: (id: string) => void;
  hoveredCategoryId: string | null;
  setStaffPanel: React.Dispatch<React.SetStateAction<StaffPanelState | null>>;
  setAddPrompt: React.Dispatch<React.SetStateAction<AddPromptState | null>>;
  slots: SchedulerSlots;
  categoryHeights: Record<string, number>;
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
  totalHVirtual,
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
  categoryHeights,
}: GridViewSidebarProps): React.ReactElement {
  const { labels, getColor, timelineSidebarFlat } = useSchedulerContext();
  // Flat sidebar: active when config requests it AND we are in timeline (multiday) mode
  const flatSidebar = !!(timelineSidebarFlat && isDayViewMultiDay)

  // Shifts for the visible date window
  const visibleShifts = React.useMemo(() => {
    const refDate = focusedDate ?? dates[0];
    if (!refDate) return baseShifts.filter((s) => selEmps.has(s.employeeId));
    if (isWeekView) {
      const dow = refDate.getDay();
      const ws = new Date(refDate);
      ws.setDate(refDate.getDate() - (dow === 0 ? 6 : dow - 1));
      ws.setHours(0, 0, 0, 0);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      we.setHours(23, 59, 59, 999);
      const s = ws.toISOString().slice(0, 10);
      const e = we.toISOString().slice(0, 10);
      return baseShifts.filter(
        (sh) => selEmps.has(sh.employeeId) && sh.date >= s && sh.date <= e,
      );
    }
    const iso = refDate.toISOString().slice(0, 10);
    return baseShifts.filter(
      (sh) => sh.date === iso && selEmps.has(sh.employeeId),
    );
  }, [baseShifts, isWeekView, focusedDate, dates, selEmps]);

  // Build a map: categoryId → { vrStart, vrSize } for sticky calc
  const catVrMap = React.useMemo(() => {
    const map: Record<string, { start: number; size: number }> = {};
    rowVirtualizer.getVirtualItems().forEach((vr) => {
      const row = flatRows[vr.index];
      if (row?.kind === "category") {
        map[row.category.id] = { start: vr.start, size: vr.size };
      }
    });
    return map;
  }, [rowVirtualizer, flatRows]);

  // For each category, total height = catVr.size + sum of its employee row sizes
  const catTotalHeights = React.useMemo(() => {
    const map: Record<string, number> = {};
    // Walk flatRows: accumulate heights per category from the accurate categoryHeights map
    for (const row of flatRows) {
      const key =
        row.kind === "employee" && row.employee
          ? `emp:${row.employee.id}`
          : `cat:${row.category.id}`;
      const h =
        categoryHeights[key] ?? (row.kind === "category" ? ROLE_HDR : 50);
      map[row.category.id] = (map[row.category.id] ?? 0) + h;
    }
    return map;
  }, [flatRows, categoryHeights, ROLE_HDR]);

  return (
    <>
      {/* ── Sort header — sticky top:0, same height as grid date/hour header ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          height: HOUR_HDR_H,
          flexShrink: 0,
          background: "var(--muted)",
          borderBottom: "2px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 8px 6px",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            paddingLeft: 2,
          }}
        >
          {labels.category ?? "Resources"}
        </div>
        {!flatSidebar && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {(["name", "hours", "scheduled"] as const).map((col) => {
              const colLabel =
                col === "name"
                  ? (labels.category ?? "Category")
                  : col === "hours"
                    ? "Hours"
                    : "Shifts";
              const isActive = sortBy === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleSort(col)}
                  style={{
                    fontSize: 9,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    background: isActive ? "var(--background)" : "transparent",
                    border: isActive
                      ? "1px solid var(--border)"
                      : "1px solid transparent",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: col === "name" ? 1 : 0,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onPointerEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "var(--accent)";
                  }}
                  onPointerLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {colLabel}
                  <span
                    style={{
                      fontSize: 8,
                      opacity: isActive ? 1 : 0.5,
                      marginLeft: 1,
                    }}
                  >
                    {isActive ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/*
        ── Rows container — same height as grid virtualizer ──
        position:relative + height:totalHVirtual mirrors the grid exactly.
        Each row uses position:absolute + top:vr.start — same coordinates as grid rows.
        Category headers use sticky top:HOUR_HDR_H so they stick below the sort header
        and stack as you scroll through their employee rows.
      */}
      <div
        style={{ position: "relative", height: totalHVirtual, flexShrink: 0 }}
      >
        {rowVirtualizer.getVirtualItems().map((vr) => {
          const row = flatRows[vr.index];
          if (!row) return null;
          const cat = row.category;
          const c = getColor(cat.colorIdx);

          // ── Category header ──
          if (row.kind === "category") {
            // In timeline mode: render a simple flat list row — just the name and
            // a color accent. No group chrome (progress bar, staff button, collapse).
            if (flatSidebar) {
              const catShiftsFlat = visibleShifts.filter(
                (s) => s.categoryId === cat.id,
              )
              const catHoursFlat = catShiftsFlat.reduce(
                (sum, s) => sum + (s.endH - s.startH),
                0,
              )
              const initials = cat.name
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()
              return (
                <div
                  key={row.key}
                  style={{
                    position: "absolute",
                    top: vr.start,
                    left: 0,
                    right: 0,
                    height: vr.size,
                    borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                    background:
                      hoveredCategoryId === cat.id
                        ? `${c.bg}0d`
                        : "var(--background)",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 14,
                    paddingRight: 8,
                    gap: 8,
                    overflow: "hidden",
                    transition: "background 80ms ease",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `${c.bg}20`,
                      border: `1.5px solid ${c.bg}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: c.bg,
                      flexShrink: 0,
                    }}
                  >
                    {cat.avatar && !cat.avatar.match(/^[A-Z]{1,2}$/) ? (
                      <img
                        src={cat.avatar}
                        alt={cat.name}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.display = "none" }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--muted-foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {catShiftsFlat.length} {labels.shift ?? "shift"}{catShiftsFlat.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {catHoursFlat > 0 && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        flexShrink: 0,
                        color: c.text,
                        background: c.light,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {catHoursFlat.toFixed(0)}h
                    </div>
                  )}
                </div>
              )
            }

            const catShifts = visibleShifts.filter(
              (s) => s.categoryId === cat.id,
            );
            const scheduled = catShifts.length;
            const totalHours = catShifts.reduce(
              (sum, s) => sum + (s.endH - s.startH),
              0,
            );
            const staffCount = ALL_EMPLOYEES.filter(
              (e) => e.categoryId === cat.id,
            ).length;
            const hoursCapacity = 40;
            const hoursPercent = Math.min(
              100,
              (totalHours / hoursCapacity) * 100,
            );
            const isOverCapacity = totalHours > hoursCapacity;

            const catTotal = catTotalHeights[cat.id] ?? vr.size;

            return (
              <div
                key={row.key}
                style={{
                  position: "absolute",
                  top: vr.start,
                  left: 0,
                  right: 0,
                  height: catTotal,
                  zIndex: 4,
                  pointerEvents: "none",
                  borderBottom: `1px solid ${c.bg}25`,
                  background:
                    hoveredCategoryId === cat.id ? `${c.bg}14` : `${c.bg}07`,
                  transition: "background 80ms ease",
                }}
              >
                <div
                  style={{
                    position: "sticky",
                    top: HOUR_HDR_H,
                    pointerEvents: "auto",
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    borderBottom: `1px solid ${c.bg}25`,
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: c.bg,
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                  <div
                    style={{
                      height: ROLE_HDR,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 14,
                      paddingRight: 8,
                      gap: 6,
                    }}
                  >
                    {slots.resourceHeader ? (
                      slots.resourceHeader({
                        resource: cat,
                        scheduledCount: scheduled,
                        isCollapsed: collapsed.has(cat.id),
                        onToggleCollapse: () => toggleCollapse(cat.id),
                      })
                    ) : flatSidebar ? (
                      // Timeline / event mode — just the name, no staff stats or Staff button
                      <>
                        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.bg, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {cat.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCollapse(cat.id)}
                          aria-label={collapsed.has(cat.id) ? "Expand" : "Collapse"}
                          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", transform: collapsed.has(cat.id) ? "rotate(-90deg)" : "none", transition: "transform 0.2s", flexShrink: 0, borderRadius: 4 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--foreground)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.2,
                            }}
                          >
                            {cat.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--muted-foreground)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: 1.2,
                            }}
                          >
                            {staffCount} staff
                            {scheduled > 0
                              ? ` · ${scheduled} shift${scheduled !== 1 ? "s" : ""}`
                              : ""}
                            {totalHours > 0
                              ? ` · ${totalHours.toFixed(1)}h`
                              : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCollapse(cat.id)}
                          aria-label={
                            collapsed.has(cat.id) ? "Expand" : "Collapse"
                          }
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--muted-foreground)",
                            transform: collapsed.has(cat.id)
                              ? "rotate(-90deg)"
                              : "none",
                            transition: "transform 0.2s",
                            flexShrink: 0,
                            borderRadius: 4,
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setStaffPanel((p) =>
                              p?.categoryId === cat.id
                                ? null
                                : { categoryId: cat.id, anchorRect: rect },
                            );
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: c.text,
                            background: c.light,
                            border: `1px solid ${c.border}`,
                            borderRadius: 5,
                            padding: "3px 7px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {labels.staff}
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ padding: "0 14px 5px", flexShrink: 0 }}>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          background: isOverCapacity
                            ? "var(--destructive)"
                            : c.bg,
                          width: `${hoursPercent}%`,
                          transition: "width 300ms ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // ── Employee row ──
          const emp = row.employee!;
          const empShifts = visibleShifts.filter(
            (s) => s.categoryId === cat.id && s.employeeId === emp.id,
          );
          const empHours = empShifts.reduce(
            (sum, s) => sum + (s.endH - s.startH),
            0,
          );
          const initials = emp.name
            .split(" ")
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <div
              key={row.key}
              style={{
                position: "absolute",
                top: vr.start,
                left: 0,
                right: 0,
                height: vr.size,
                borderBottom:
                  "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                background:
                  hoveredCategoryId === cat.id
                    ? `${c.bg}0d`
                    : "var(--background)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 14,
                paddingRight: 8,
                gap: 8,
                overflow: "hidden",
                transition: "background 80ms ease",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `${c.bg}20`,
                  border: `1.5px solid ${c.bg}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.bg,
                  flexShrink: 0,
                }}
              >
                {emp.avatar && !emp.avatar.match(/^[A-Z]{1,2}$/) ? (
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted-foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {empShifts.length} shift{empShifts.length !== 1 ? "s" : ""}
                </div>
              </div>
              {empHours > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    flexShrink: 0,
                    color: empHours > 40 ? "var(--destructive)" : c.text,
                    background:
                      empHours > 40
                        ? "color-mix(in srgb, var(--destructive) 10%, transparent)"
                        : c.light,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {empHours.toFixed(0)}h
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resize handle */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: -4,
          width: 8,
          height: "100%",
          cursor: "col-resize",
          zIndex: 30,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          const startX = e.clientX,
            startW = sidebarWidth;
          const onMove = (mv: PointerEvent) =>
            setSidebarWidth(
              Math.max(120, Math.min(400, startW + mv.clientX - startX)),
            );
          const onUp = () => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
          };
          document.addEventListener("pointermove", onMove);
          document.addEventListener("pointerup", onUp);
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 3,
            width: 2,
            background: "var(--border)",
          }}
        />
      </div>

      {/* Collapse toggle */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: sidebarCollapsed ? 2 : sidebarWidth - 1,
          transform: "translateY(-50%)",
          zIndex: 50,
          transition: "left 150ms ease",
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            width: 16,
            height: 28,
            borderRadius: "0 4px 4px 0",
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderLeft: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "1px 0 4px rgba(0,0,0,0.1)",
            color: "var(--muted-foreground)",
            padding: 0,
            transition: "color 120ms, background 120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--background)";
            e.currentTarget.style.color = "var(--muted-foreground)";
          }}
        >
          {sidebarCollapsed ? (
            <ChevronsRight size={10} />
          ) : (
            <ChevronsLeft size={10} />
          )}
        </button>
      </div>
    </>
  );
}
