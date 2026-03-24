// @shadcn-scheduler/grid-engine — the real grid engine
// Exports the complete GridView, drag engine, geometry, hooks, and supporting UI.
// This package IS the source of truth for day/week/timeline rendering.

// ─── Layout primitives ────────────────────────────────────────────────────────
export { DragEngine } from './dragEngine'
export type { DragCommit, DragEngineOptions } from './dragEngine'

export {
  makeGridConfig,
  blockRect,
  ghostRect,
  xToHour,
  xToDateIndex,
} from './geometry'
export type { GridConfig, BlockRect } from './geometry'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useDragEngine } from './hooks/useDragEngine'
export { useFlatRows, buildFlatRowTops } from './hooks/useFlatRows'
export { useScrollToNow } from './hooks/useScrollToNow'
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './hooks/useMediaQuery'
export { useLongPress } from './hooks/useLongPress'
export type { LongPressOptions } from './hooks/useLongPress'

// ─── Main GridView ────────────────────────────────────────────────────────────
export { GridView } from './GridView'
export type { GridViewProps } from './GridView'

// ─── Supporting components ────────────────────────────────────────────────────
export { GridViewSidebar } from './GridViewSidebar'
export { StaffPanel } from './StaffPanel'
export { UserSelect } from './UserSelect'

// ─── Modals ───────────────────────────────────────────────────────────────────
export { AddShiftModal } from './modals/AddShiftModal'
export { RoleWarningModal } from './modals/RoleWarningModal'

// ─── UI primitives ────────────────────────────────────────────────────────────
export { cn } from './lib/utils'
export { Button } from './ui/button'
export { BottomSheet } from './ui/BottomSheet'

// ─── Additional modals ────────────────────────────────────────────────────────
export { ShiftModal } from './modals/ShiftModal'
export { DayShiftsDialog } from './modals/DayShiftsDialog'
