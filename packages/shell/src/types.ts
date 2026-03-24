// Shell types — re-export from core plus React-specific additions
import type {
  Block,
  Resource,
  Settings,
  SchedulerConfig,
  SchedulerSlots,
  CategoryColor,
  ViewKey,
} from '@shadcn-scheduler/core'
import type { ComponentType, ReactNode } from 'react'

export type { Block, Resource, Settings, SchedulerConfig, CategoryColor, ViewKey }

export interface Plugin {
  id: string
  name: string
  version: string
  slots: Record<string, ComponentType<SlotProps>>
  lifecycle?: PluginLifecycle
  config?: PluginConfig
}

export interface PluginLifecycle {
  onMount?: (context: SchedulerContextValue) => void
  onUnmount?: (context: SchedulerContextValue) => void
  onShiftsChange?: (shifts: Block[], context: SchedulerContextValue) => void
}

export interface PluginConfig {
  [key: string]: unknown
}

/** The context value exposed via useSchedulerContext(). Exactly mirrors the real shadcn-scheduler context shape. */
export interface SchedulerContextValue {
  categories: Resource[]
  employees: Resource[]
  /** Resolved labels — default values merged with any config.labels overrides */
  labels: {
    category: string
    employee: string
    shift: string
    staff: string
    roster: string
    addShift: string
    publish: string
    draft: string
    published: string
    selectStaff: string
    copyLastWeek: string
    fillFromSchedules: string
    publishAll: string
    categories: string
  }
  getColor: (idx: number) => CategoryColor
  settings: Settings
  nextUid: () => string
  slots: Partial<SchedulerSlots>
  snapMinutes?: number
  timezone?: string
  locale?: string
  isRTL?: boolean
  allowOvernight?: boolean
  timelineSidebarFlat?: boolean
  /** Format a fractional hour for display — timezone-aware when SchedulerConfig.timezone is set */
  getTimeLabel: (isoDate: string, hour: number) => string
  /** Format a date for display — uses config.locale when set */
  getDateLabel: (date: Date, options?: Intl.DateTimeFormatOptions) => string
}

export type SlotType =
  | 'cell-overlay'
  | 'block-decorator'
  | 'header-action'
  | 'sidebar-panel'
  | 'modal-content'
  | 'toolbar-item'

export interface SlotProps {
  context: SchedulerContextValue
  data?: unknown
  position?: { x: number; y: number; width: number; height: number }
}

export type EventHandler = (data: unknown) => void
