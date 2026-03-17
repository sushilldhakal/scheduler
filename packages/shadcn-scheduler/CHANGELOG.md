# Changelog

All notable changes to shadcn-scheduler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.3.2] - 2026-03-17

### Added

- **Performance — Windowed data**: Day and week views now pre-filter shifts to only the visible date window before passing to GridView. With a 21-day buffer, ~6,000 shifts enter the grid instead of 104,000 for a full year — ~17× reduction.
- **Performance — Shift index**: GridView builds a `Map<categoryId:dateISO, Block[]>` for O(1) lookups instead of scanning all shifts per cell. Per-cell cost drops from 104,000 iterations to a single `Map.get()`.
- **Performance — Memoized displayShifts**: `displayShifts` is now memoized so it no longer invalidates `categoryHeights` and downstream useMemos on every render.
- **Performance — DOM ghost during drag**: The drag preview ghost is updated via direct DOM manipulation instead of React state. Pointer move no longer triggers React re-renders; only drag start and drag end do. Combined with the above, drag stays smooth even with large datasets.
- **Performance — CSS containment & GPU hints**: Grid container uses `contain: layout style` and `willChange: contents` during drag. Blocks use `contain: layout style paint` and `willChange: transform` when dragging. `scheduler-tokens.css` adds global rules for `[data-scheduler-block]` and `[data-scheduler-ghost]` for isolated rendering islands.

### Changed

- **Hour grid borders**: Day and week view hour separators now use `--sch-b-12` for consistent, subtle borders.
- **Demo data**: Demo page uses lighter test data (20 staff, 5 categories, 7 days) for faster load.

### Fixed

- Demo page now anchors to the current week on load and uses correct date range.

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
