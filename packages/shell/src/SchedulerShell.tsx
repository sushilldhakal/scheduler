// Scheduler Shell - Main container component

import React, { ComponentType, ReactNode } from 'react'
import type { Block } from '@shadcn-scheduler/core'
import { useSchedulerContext } from './SchedulerProvider'

export interface ViewProps {
  shifts: Block[]
  onShiftsChange: (shifts: Block[]) => void
}

export interface SettingsProps {
  // Settings component props
}

export interface SchedulerShellProps {
  shifts: Block[]
  onShiftsChange: (shifts: Block[]) => void
  view: ComponentType<ViewProps>
  headerActions?: ReactNode
  settings?: ComponentType<SettingsProps>
}

export function SchedulerShell({
  shifts,
  onShiftsChange,
  view: ViewComponent,
  headerActions,
  settings: SettingsComponent
}: SchedulerShellProps) {
  const context = useSchedulerContext()

  return (
    <div className="scheduler-shell">
      {headerActions && (
        <div className="scheduler-header">
          {headerActions}
        </div>
      )}
      
      <div className="scheduler-content">
        <ViewComponent 
          shifts={shifts}
          onShiftsChange={onShiftsChange}
        />
      </div>
      
      {SettingsComponent && (
        <div className="scheduler-settings">
          <SettingsComponent />
        </div>
      )}
    </div>
  )
}