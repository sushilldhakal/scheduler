# Changelog

All notable changes to shadcn-scheduler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-03-19

### Added

- **Row mode**: Category vs individual — one row per employee under collapsible category headers. Toggle in Settings.
- **Right-click context menu**: Edit, Copy, Cut, Delete on shift blocks. Cut copies to buffer; Ctrl+V pastes.
- **Hover popover**: Employee name, category, time range, duration, break info, conflict warning on block hover.
- **2D free drag**: Block follows cursor across the grid. Vertical edge-scroll. 4px desktop drag threshold.
- **Break support**: `breakStartH` and `breakEndH` on blocks; add/edit in shift modals.
- **Sidebar**: Resizable handle, sortable columns, capacity bar per category.
- **Webhook callbacks**: `onBlockCreate`, `onBlockDelete`, `onBlockMove`, `onBlockResize`, `onBlockPublish`, `onAuditEvent`.

### Changed

- Drag performance: grab offset and grid rect captured once; RAF-based edge scroll.
- New peer dependencies: `@radix-ui/react-context-menu`, `react-resizable-panels`.

See [packages/shadcn-scheduler/CHANGELOG.md](./packages/shadcn-scheduler/CHANGELOG.md) for full details.

---

## [0.3.3] - 2025-03-19

### Changed

- Version bump for npm publish.

---

## [0.3.2] - 2025-03-19

### Changed

- **npm publishing**: Package is published to the public npm registry at [npmjs.com/package/@sushill/shadcn-scheduler](https://www.npmjs.com/package/@sushill/shadcn-scheduler). Install with `npm install @sushill/shadcn-scheduler`.
- **Documentation**: README and changelog updated with clear npm install and publish instructions.

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
