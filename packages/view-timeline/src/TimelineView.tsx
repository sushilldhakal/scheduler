/**
 * @shadcn-scheduler/view-timeline
 *
 * Thin wrapper around the real TimelineView from @sushill/shadcn-scheduler.
 * TimelineView is already a thin wrapper around GridView in day-multiday mode,
 * so this package gives the full grid engine (drag, resize, EPG styling, etc.)
 *
 * Requires a <SchedulerProvider> from @shadcn-scheduler/shell as an ancestor.
 */
export { TimelineView, type TimelineViewProps } from '@sushill/shadcn-scheduler'
