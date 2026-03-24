// @shadcn-scheduler/shell — React context, provider, and plugin system

export * from './SchedulerProvider'
export * from './SchedulerShell'
export * from './PluginManager'
export * from './SlotRenderer'
export * from './types'
export * from './hooks'

// Re-export nextUid from core for convenience
export { nextUid } from '@shadcn-scheduler/core'
