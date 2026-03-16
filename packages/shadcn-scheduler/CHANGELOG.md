# Changelog

All notable changes to shadcn-scheduler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Block and Resource generics (Track A Step 2)**  
  - `Block<TMeta = Record<string, unknown>>` and `Resource<TMeta = Record<string, unknown>>` now accept an optional generic for domain-specific data.  
  - Optional `meta?: TMeta` on both types. Use `Block<YourMeta>` or `Resource<YourMeta>` for typed meta (e.g. money, episode numbers, qualification codes).
- **Preset support in createSchedulerConfig (Track A Step 3)**  
  - `createSchedulerConfig({ preset: 'default' | 'tv', ...overrides })` applies a preset then merges overrides.  
  - **`default`**: Standard roster labels and 7–20h range.  
  - **`tv`**: Channel/Program vocabulary, 24h range, `initialScrollToNow`, `showLiveIndicator`, `views: { year: false, list: false }`, 15‑min snap.
  - New config options: `views?: Partial<Record<ViewKey, boolean>>` (per-view visibility), `showLiveIndicator?: boolean`, `snapMinutes?: number`.
  - `ViewTabs` accepts `views` and hides tabs when `views[key] === false`.
- **File structure: core/ and domains/ (Track A Step 4)**  
  - Engine code lives under `core/` (types, constants, context, config, hooks, utils, components, Scheduler).  
  - **Domain wrappers** under `domains/`: `SchedulerDefault` (default preset) and `SchedulerTV` (preset `"tv"`).  
  - Import `Scheduler` for the raw engine; import `SchedulerDefault` or `SchedulerTV` for a preset-applied scheduler.  
  - Main entry re-exports from core and domains.
- **Render slots (Track A Step 5)**  
  - `Scheduler` and `SchedulerProvider` accept optional **`slots`**: `Partial<SchedulerSlots>`.  
  - **Slot types**: `block`, `resourceHeader`, `timeSlotLabel`, `emptyCell`, `emptyState`.  
  - When a slot is provided, the engine uses it instead of the built-in UI for that surface; omitted slots use defaults.  
  - **`block`**: `(props: BlockSlotProps) => ReactNode` — block content (block, resource, isDraft, isDragging, hasConflict, widthPx, onDoubleClick).  
  - **`resourceHeader`**: `(props: ResourceHeaderSlotProps) => ReactNode` — category row header (resource, scheduledCount, isCollapsed, onToggleCollapse).  
  - Other slot props: `TimeSlotLabelSlotProps`, `EmptyCellSlotProps`, `EmptyStateSlotProps` (hooks for future use).  
  - Slot types are exported for custom renderers.
- **Multiple entry points and per-domain registry (Track A Step 6)**  
  - **Subpath exports**: `@sushill/shadcn-scheduler` (main), `@sushill/shadcn-scheduler/tv`, `@sushill/shadcn-scheduler/default` for smaller bundles when using only one domain.  
  - **Registry**: `scheduler` (default block) and `scheduler-tv` (TV preset block) are in the shadcn registry. Add via URL or registry index so `npx shadcn add scheduler-tv` (or add by item URL) installs the TV block.
- **Block date as ISO string (Phase 7 / P7-06)**  
  - Helpers: `toDateISO(d: Date)` for creating `Block.date`, `parseBlockDate(block)` for parsing to `Date`, `sameDay` now accepts `Date | string`.  
  - Exported from main entry for consumers.
- **Scheduler namespace (P7-26)**  
  - `Scheduler` is the core component with domain attachments: `Scheduler.roster`, `Scheduler.tv`, `Scheduler.conference`, `Scheduler.festival`, `Scheduler.healthcare`, `Scheduler.gantt`, `Scheduler.venue`. Use `<Scheduler />` for raw engine or `<Scheduler.roster />`, `<Scheduler.tv />`, etc.
- **Config views (P7-27)**  
  - `SchedulerConfig.views` is `Partial<Record<ViewKey, boolean>>` (ViewKey = 'day' | 'week' | 'month' | 'year' | 'timeline' | 'gantt' | 'list' | 'now'). Set `views: { year: false }` to hide a tab. Replaces `enabledViews`.
- **Presets (P7-12)**  
  - Added presets: `roster`, `default`, `tv`, `conference`, `festival`, `healthcare`, `gantt`, `venue`. Use `createSchedulerConfig({ preset: 'conference' })` etc.
- **Domain wrappers (P7-21–25)**  
  - `SchedulerConference`, `SchedulerFestival`, `SchedulerHealthcare`, `SchedulerGantt`, `SchedulerVenue`; subpath exports `@sushill/shadcn-scheduler/conference`, `/festival`, `/healthcare`, `/gantt`, `/venue`.
- **Slots in views (Task 7)**  
  - TimelineView, MonthView, YearView, ListView read `slots` from context. `renderBlock`, `renderResourceHeader`, `renderEmptyState` apply in Timeline and List/Year empty states.
- **Phase 13 — Performance**  
  - `onVisibleRangeChange` is debounced by 100ms (P13-09) to avoid excessive calls during scroll.  
  - GridView, TimelineView, MonthView, ListView, YearView are wrapped in `React.memo` for fewer re-renders (P13-08).  
  - tsup build uses `splitting: true` for code splitting across entries (P13-11).  
  - Bundle sizes (ESM, approximate): main ~268 KB, domain entries ~255 KB each; target &lt;50 KB gzipped per entry with tree-shaking (P13-10).
- **Phase 14 — i18n &amp; Export**  
  - **Config**: `timezone?`, `locale?`, `isRTL?`, `firstDay?: 0 | 1` on SchedulerConfig. `getWeekDates(date, firstDay)` supports Sunday/Monday start.  
  - **Timezone**: `formatInTimezone(isoDate, hour, tz, locale?)` and `formatTimeInTimezone` in `core/utils/timezone.ts` (Intl, no extra deps).  
  - **Export**: `exportToCSV(blocks, filename)` in `core/utils/export.ts`; flattens meta columns; no dependency.  
  - **readOnly**: When `readOnly={true}`, drag, resize, and add are disabled; blocks are view-only.  
  - **Callbacks**: `onBlockCreate`, `onBlockDelete`, `onBlockMove`, `onBlockResize`, `onBlockPublish` on SchedulerProps (full Block payload).  
  - **useAuditTrail**: Hook `useAuditTrail(onAuditEvent?)` returns `{ log, clearLog, append }` for audit entries (create/delete/move/resize/publish).
- **Phase 15 — Testing &amp; DX**  
  - **Vitest**: `vitest.config.ts` with jsdom; `npm run test` and `npm run test:watch`.  
  - **Unit tests**: `packing.test.ts` (packShifts, findConflicts, getCategoryRowHeight), `constants.test.ts` (fmt12, toDateISO, parseBlockDate, sameDay, getWeekDates, snapH), `config.test.ts` (createSchedulerConfig, presets, overrides).

### Breaking

- **`enabledViews` replaced by `views` (P7-27)**  
  - Config and ViewTabs now use `views?: Partial<Record<ViewKey, boolean>>`. Migrate `enabledViews: ['day','week','month']` to `views: { day: true, week: true, month: true, year: false, timeline: false, list: false }` (or omit to show all).
- **Block.date is now string (P7-06)**  
  - `Block.date` is an ISO date string (`YYYY-MM-DD`), not a `Date` object. Use `toDateISO(date)` when creating/updating blocks and `parseBlockDate(block)` or `sameDay(block.date, other)` when comparing.  
  - **Migration**: Replace `date: someDate` with `date: toDateISO(someDate)`; replace `sameDay(s.date, d)` (no change, `sameDay` accepts string); replace any `s.date.getFullYear()` etc. with `parseBlockDate(s).getFullYear()` or `new Date(s.date + 'T12:00:00').getFullYear()`.
- **Type renames (Track A Step 1)**  
  - `Shift` → `Block`: All schedule items (shifts) are now typed as `Block`.  
  - `Category` and `Employee` → `Resource`: Row headers (categories) and assignable staff (employees) are merged into a single `Resource` type with a `kind` discriminator: `kind: "category"` for row resources, `kind: "employee"` for staff.  
  - **Migration**: Use `Block` instead of `Shift`; use `Resource` with `kind: "category"` for categories and `kind: "employee"` for employees. Add `kind` to every category/employee object.  
  - Public props remain `shifts`, `onShiftsChange`, `categories`, `employees`; only the TypeScript types change.

---

## [0.3.0] - 2026-03-13

### Added

- **Zoom-based time intervals (day view)**: When zoomed in (zoom ≥ 1.25), day view shows **30-minute** time labels (7:00, 7:30, 8:00…) and grid lines; at default zoom, hourly labels (7am, 8am…) are shown. Shifts can be placed and snapped at 30-minute increments.
- **Zoom-based time labels (week view)**: Week view time label gap now depends on zoom: **1-hour** when zoomed in (zoom ≥ 1.25), **2-hour** at default (0.8 ≤ zoom < 1.25), **4-hour** when zoomed out (zoom < 0.8) so labels fit in narrow columns (~117px).
- **Drag shifts between days**: In day and week view, you can drag an existing shift to a different day. When moving across days, the shift keeps its start/end time (no accidental resize).
- **Week view scroll sync**: The calendar header range updates as you scroll horizontally in week view to reflect the visible week. Scrolling near the left or right edge loads the previous or next week (buffer) and preserves scroll position.
- **Month view “+X more”**: On dates with overflow shifts, hovering “+X more” shows a popover with the list of overflow shifts; clicking opens a dialog with all shifts for that day, grouped by category with times.
- **Year view scheduled dates**: Days that have shifts now use a clearer highlight (primary color) so scheduled dates are easier to see.
- **Double-click navigation**: Double-click a date in month view to open that week in week view; double-click a date in week view to open that day in day view.
- **Prefetching / data loading API**: New props `bufferDays` (default 15), `onVisibleRangeChange`, and `prefetchThreshold` (default 0.8) for loading data as the user scrolls. Day and week views render a configurable buffer of days/weeks; the callback fires when the user scrolls near the edge so the host can fetch from an API and optionally trim old data.
- **Week view date headers**: Day headers in week view now include the month name (e.g. “Mar Tue 17”) for context.

### Changed

- **“Now” indicator**: The red “now” line in day/week view is now a muted, less distracting color so it doesn’t dominate the grid.
- **Week view header date**: Header shows the visible week (display date) while scrolling without rebuilding the full buffer, so scrolling stays smooth and prev/next week at the edges works correctly.

### Fixed

- Week view: Header date range now updates correctly when scrolling horizontally (no more jump-back or wrong range).
- Day view: Dragging a shift to another day no longer changes its duration (resize was incorrectly applied on cross-day move).

---

## [0.2.0] - 2025-03-13

### Added

- **Day view with infinite horizontal scroll**: Day view now shows 31 days in a continuous horizontal timeline. Each day displays its visible hours (e.g., 7am–5pm) with hour labels (7am, 8am, 9am, etc.) in each day column header. Scroll left/right to navigate through dates.
- **Day view date sync**: The calendar date navigator updates as you scroll in day view, and clicking a date in the calendar (or using prev/next) scrolls the day view to that date.
- **Week view time labels**: Hour labels (7am, 9am, 11am, etc.) now appear below each date in week view, with 2-hour intervals. Configurable via `WEEK_TIME_LABEL_GAP` in constants.
- **Week view wider columns**: Day columns in week view are now larger for better readability.
- **Add-shift (+) button placement**: The + button to add shifts is now fixed at the bottom of each category cell, always visible, and no longer overlapped by shift blocks.
- **Settings gear in header**: The settings gear icon is now in the header next to the action buttons instead of the footer.

### Changed

- **Badge variant (shift interaction mode)**: Replaced options (Dot, Background, Both) with:
  - **Drag & drop**: Only drag shifts; no resize handles
  - **Resizable**: Only resize shifts; no drag
  - **Both**: Drag and resize (default)
- **Visible hours in day view**: Day view now only shows the visible hour range (e.g., 7am–5pm). Hours outside the range (e.g., 9am or 6pm) are no longer displayed when the range is 10am–5pm.
- **Removed dot badge style**: The dot-only visual style has been removed. Shifts always use the default background gradient.
- **footerSlot location**: The `footerSlot` prop now renders in the header area (before header actions) rather than the footer. The prop name is kept for backward compatibility.

### Fixed

- Day view now correctly syncs with the date navigator when scrolling horizontally.
- Calendar date picker now scrolls day view to the selected date.

---

## [0.1.0] - Initial Release

### Added

- Multiple views: Day, Week, Month, and Year
- List view with drag-to-reorder
- Drag & drop shifts between categories and time slots
- Resize shifts (when badge variant is "both")
- Staff panel: Drag employees from unscheduled list onto the grid
- Draft/Published shift status
- Category-based organization
- Configurable labels and category colors
- SchedulerProvider for shared config
- headerActions and footerSlot for customization
- Calendar settings (visible hours, working hours, badge variant)
