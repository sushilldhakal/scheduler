# shadcn-scheduler

[![npm version](https://img.shields.io/npm/v/@sushill/shadcn-scheduler.svg)](https://www.npmjs.com/package/@sushill/shadcn-scheduler)

A flexible shift scheduling component for React, designed to work seamlessly with **shadcn UI**, **Tailwind CSS**, and **lucide-react** icons.

## Features

- **Multiple views**: Day, Week, Month, and Year
- **Day view**: Horizontal scroll with configurable buffer (`bufferDays`), hour or 30‑minute labels per day (zoom-based), date sync with navigator. Drag existing shifts to another day; time is preserved when moving across days.
- **Week view**: Time labels below each date with zoom-based spacing (1h when zoomed in, 2h default, 4h when zoomed out). Scroll syncs the header range; scroll near the edge to load previous/next week. Month + day in headers (e.g. “Mar Tue 17”).
- **Month view**: “+X more” on busy dates—hover to see overflow list, click to open a dialog with all shifts for that day grouped by category and hours.
- **Year view**: Scheduled dates use a clearer highlight (primary color) so they stand out.
- **Navigation**: Double‑click a date in month view to open that week in week view; double‑click a date in week view to open that day in day view.
- **List view**: Compact list with drag-to-reorder
- **Drag & drop**: Move shifts between categories, time slots, and days; configurable drag vs resize behavior
- **Staff panel**: Drag employees from unscheduled list onto the grid
- **Draft/Published**: Shifts can be in draft (hidden from staff) or published
- **Category-based**: Organize shifts by categories (e.g., Department, Team, Role—fully configurable)
- **Zoom**: Day and week views support zoom in/out. Day view shows 30‑minute intervals when zoomed in; week view adjusts time label density (1h / 2h / 4h) so labels stay readable.
- **Prefetching**: Optional `bufferDays`, `onVisibleRangeChange`, and `prefetchThreshold` for large datasets or API-backed shifts.
- **Configurable labels**: Rename Category, Employee, Shift, Staff, and more via props
- **Provider pattern**: Wrap with `SchedulerProvider` for shared config across multiple schedulers
- **Visible hours**: Restrict day/week view to a time range (e.g., 7am–5pm)
- **Add-shift button**: Fixed at bottom of each cell, always visible
- **Now indicator**: Subtle “now” line in day/week view (muted, non-distracting)

## Installation

### 1. Install the package

Available from **npm** and **GitHub Packages**:

```bash
npm install @sushill/shadcn-scheduler
```

For GitHub Packages, add to `~/.npmrc`: `@sushill:registry=https://npm.pkg.github.com` and authenticate with a GitHub token.

### 2. Install peer dependencies

If you're using **shadcn UI**, you likely already have most of these. Ensure you have:

```bash
npm install react react-dom lucide-react tailwindcss
npm install @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle-group @radix-ui/react-checkbox @radix-ui/react-slot
npm install react-day-picker class-variance-authority clsx tailwind-merge
```

Or with a single command:

```bash
npm install @sushill/shadcn-scheduler react react-dom lucide-react tailwindcss @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle-group @radix-ui/react-checkbox @radix-ui/react-slot react-day-picker class-variance-authority clsx tailwind-merge
```

### 3. Configure Tailwind

**Important:** Add the package to your Tailwind `content` paths. Without this, utility classes used by the scheduler (e.g. `bg-primary`, `text-foreground`) will not be generated and styles will not apply.

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@sushill/shadcn-scheduler/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        input: "var(--input)",
        ring: "var(--ring)",
      },
    },
  },
  // ... rest of your config
}
```

### 4. CSS variables (light & dark mode)

The scheduler uses shadcn-style design tokens. Variables must use **space-separated HSL values** (e.g. `0 0% 9%`) so that `hsl(var(--primary))` works in Tailwind. Include in your `globals.css`:

```css
@layer base {
  :root {
    --radius: 0.625rem;
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 9%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 0 0% 44%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
  }
  .dark {
    --background: 0 0% 9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --muted: 0 0% 13%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 0% 20%;
    --accent-foreground: 0 0% 98%;
    --border: 0 0% 20%;
    --popover: 0 0% 13%;
    --popover-foreground: 0 0% 98%;
    --destructive: 0 62% 50%;
  }
}
```

For dark mode, set `darkMode: "class"` in your Tailwind config and toggle the `dark` class on `<html>`.

## Usage

### Option 1: Use Scheduler directly

The `Scheduler` component wraps its content in `SchedulerProvider` internally. Pass categories, employees, shifts, and optional config:

```tsx
import { useState } from "react"
import { Scheduler, type Block, type Resource } from "@sushill/shadcn-scheduler"

const categories: Resource[] = [
  { id: "c1", name: "Front Desk", colorIdx: 0, kind: "category" },
  { id: "c2", name: "Kitchen", colorIdx: 1, kind: "category" },
]

const employees: Resource[] = [
  { id: "e1", name: "Alice B.", categoryId: "c1", avatar: "AB", colorIdx: 0, kind: "employee" },
  { id: "e2", name: "Tom H.", categoryId: "c1", avatar: "TH", colorIdx: 0, kind: "employee" },
  { id: "e3", name: "Chef Marco", categoryId: "c2", avatar: "CM", colorIdx: 1, kind: "employee" },
]

const initialShifts: Block[] = [
  {
    id: "s1",
    categoryId: "c1",
    employeeId: "e1",
    date: new Date(),
    startH: 9,
    endH: 17,
    employee: "Alice B.",
    status: "published",
  },
]

function App() {
  const [shifts, setShifts] = useState<Block[]>(initialShifts)

  return (
    <Scheduler
      categories={categories}
      employees={employees}
      shifts={shifts}
      onShiftsChange={setShifts}
      config={% raw %}{{% endraw %}
        labels: { category: "Department", employee: "Staff" },
        defaultSettings: {
          visibleFrom: 8,
          visibleTo: 22,
        },
      {% raw %}}}{% endraw %}
    />
  )
}
```

### Option 2: Use SchedulerProvider for multiple schedulers

When you need multiple scheduler instances sharing the same config:

```tsx
import { SchedulerProvider, Scheduler } from "@sushill/shadcn-scheduler"

<SchedulerProvider
  categories={categories}
  employees={employees}
  config={config}
  nextUidFn={() => `id-${Date.now()}`}
>
  <Scheduler shifts={shifts} onShiftsChange={setShifts} />
</SchedulerProvider>
```

### Adding custom header actions

Use `headerActions` to add buttons (e.g. Copy Last Week, Fill from Schedules). Pass a function to receive built-in actions:

```tsx
import { Scheduler, RosterActions } from "@sushill/shadcn-scheduler"

<Scheduler
  categories={categories}
  employees={employees}
  shifts={shifts}
  onShiftsChange={setShifts}
  headerActions={({ copyLastWeek, publishAllDrafts, draftCount }) => (
    <RosterActions
      onCopyLastWeek={copyLastWeek}
      onFillFromSchedules={() => alert("Connect your engine")}
      onPublishAll={publishAllDrafts}
      draftCount={draftCount}
    />
  )}
/>
```

Or pass any custom ReactNode:

```tsx
headerActions={
  <>
    <Button onClick={myAction}>Custom</Button>
  </>
}
```

### Calendar settings (gear icon)

Use `footerSlot` to add a settings panel in the header (next to action buttons). The built-in `SchedulerSettings` provides:

- **Shift badge style**: Choose how shifts behave:
  - **Drag & drop** – Move shifts only, no resize handles
  - **Resizable** – Resize shifts only, no drag
  - **Both** – Drag and resize (default)
- **Visible hours**: Time range shown in day/week view (e.g. 7am–5pm). Hours outside this range are hidden.
- **Working hours**: Per-day hours; cells outside show dashed background

```tsx
import { Scheduler, SchedulerSettings } from "@sushill/shadcn-scheduler"

<Scheduler
  shifts={shifts}
  onShiftsChange={setShifts}
  footerSlot={({ onSettingsChange }) => (
    <SchedulerSettings onSettingsChange={onSettingsChange} />
  )}
/>
```

You can also use the individual inputs:

```tsx
import {
  ChangeBadgeVariantInput,
  ChangeVisibleHoursInput,
  ChangeWorkingHoursInput,
} from "@sushill/shadcn-scheduler"
```

## Props

### Scheduler

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `categories` | `Resource[]` | Yes* | List of row resources (e.g., Department, Team) with `kind: "category"` |
| `employees` | `Resource[]` | Yes* | List of staff resources with `kind: "employee"` and `categoryId` linking to a category |
| `shifts` | `Block[]` | Yes | Current blocks/shifts (controlled) |
| `onShiftsChange` | `(blocks: Block[]) => void` | Yes | Called when shifts change |
| `config` | `SchedulerConfig` | No | Labels, category colors, default settings |
| `settings` | `Partial<Settings>` | No | Override visible hours, working hours per day |
| `initialView` | `string` | No | `"day"`, `"week"`, `"month"`, `"year"` (default: `"week"`) |
| `initialDate` | `Date` | No | Initial date to display |
| `headerActions` | `ReactNode` or `(actions) => ReactNode` | No | Custom buttons before Add Shift. Pass a function to get `copyLastWeek`, `publishAllDrafts`, `draftCount` |
| `footerSlot` | `(ctx) => ReactNode` | No | Renders in header next to actions. `ctx.onSettingsChange` updates visible hours, working hours, shift badge style |
| `bufferDays` | `number` | No | Days to render before/after visible range in day/week view. E.g. `2` = 2 before + 2 after (5 total). Default: 15 |
| `onVisibleRangeChange` | `(start: Date, end: Date) => void` | No | Fired when user scrolls near edge. Use to prefetch from API and optionally trim old shifts |
| `prefetchThreshold` | `number` | No | Scroll threshold (0–1) for firing `onVisibleRangeChange`. 0.8 = fire at 80% scrolled. Default: 0.8 |
| `slots` | `Partial<SchedulerSlots>` | No | Optional render slots to override built-in UI: `block`, `resourceHeader`, `timeSlotLabel`, `emptyCell`, `emptyState`. Omitted slots use defaults. |

\* When using `SchedulerProvider`, `categories` and `employees` can be provided at the provider level instead.

### Domain components

For preset-based usage, use the domain wrappers (same props as `Scheduler`, with preset config applied):

- **`SchedulerDefault`** — default roster (categories, employees, shifts). Config uses `createSchedulerConfig()` defaults.
- **`SchedulerTV`** — TV schedule preset: Channel/Program labels, 24h range, timeline view, live indicator. Config uses `createSchedulerConfig({ preset: "tv" })`.

```tsx
import { SchedulerDefault, SchedulerTV } from "@sushill/shadcn-scheduler"
// Use <SchedulerDefault ... /> or <SchedulerTV ... />; pass config to override preset values.
```

You can also use subpath imports for smaller bundles:

```tsx
import { SchedulerTV } from "@sushill/shadcn-scheduler/tv"
import { SchedulerDefault } from "@sushill/shadcn-scheduler/default"
```

### shadcn registry

Two blocks are available for the shadcn CLI:

- **scheduler** — Default roster scheduler block.
- **scheduler-tv** — TV preset block (Channel/Program, timeline, 24h).

Point your project’s registry at this repo (or the hosted registry URL), then run:

```bash
npx shadcn add scheduler
# or
npx shadcn add scheduler-tv
```

Or add by registry item URL (e.g. `https://yoursite.com/r/scheduler-tv.json`).

### Render slots

Pass `slots` to customize how blocks, resource headers, and other surfaces render. Each slot is a render function; if omitted, the engine uses its default. Exported slot prop types: `BlockSlotProps`, `ResourceHeaderSlotProps`, `TimeSlotLabelSlotProps`, `EmptyCellSlotProps`, `EmptyStateSlotProps`.

```tsx
<Scheduler
  slots={{
    block: ({ block, resource, isDraft, hasConflict, widthPx, onDoubleClick }) => (
      <div onClick={onDoubleClick}>{block.employee} {isDraft && "(Draft)"}</div>
    ),
    resourceHeader: ({ resource, scheduledCount, isCollapsed, onToggleCollapse }) => (
      <div onClick={onToggleCollapse}>{resource.name} ({scheduledCount})</div>
    ),
  }}
  {...otherProps}
/>
```

### Prefetching / Data loading

For large datasets or API-backed shifts, use `bufferDays`, `onVisibleRangeChange`, and `prefetchThreshold`:

```tsx
function App() {
  const [shifts, setShifts] = useState<Block[]>([])

  const handleRangeChange = async (start: Date, end: Date) => {
    if (alreadyHasData(start, end)) return
    const newShifts = await fetchShiftsFromAPI(start, end)
    setShifts(prev => {
      const combined = [...prev, ...newShifts]
      return removeOldShiftsOutsideWindow(combined, start, end)
    })
  }

  return (
    <Scheduler
      shifts={shifts}
      onShiftsChange={setShifts}
      categories={categories}
      employees={employees}
      bufferDays={3}
      onVisibleRangeChange={handleRangeChange}
      prefetchThreshold={0.8}
    />
  )
}
```

The library only renders `bufferDays` before/after the visible range, so the host app can safely trim old shifts for garbage collection and keep scrolling smooth.

### SchedulerProvider

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `categories` | `Resource[]` | Yes | Category resources (`kind: "category"`) for all child schedulers |
| `employees` | `Resource[]` | Yes | Employee resources (`kind: "employee"`) for all child schedulers |
| `config` | `SchedulerConfig` | No | Labels, colors, default settings |
| `nextUidFn` | `() => string` | No | Custom ID generator for new shifts |
| `slots` | `Partial<SchedulerSlots>` | No | Optional render slots for child schedulers |
| `children` | `ReactNode` | Yes | Child components (e.g. `<Scheduler />`) |

### SchedulerConfig

| Field | Type | Description |
|-------|------|-------------|
| `labels` | `Partial<SchedulerLabels>` | Custom labels: `category`, `employee`, `shift`, `staff`, `roster`, `addShift`, `publish`, `draft`, `published`, etc. |
| `categoryColors` | `CategoryColor[]` | Custom color palette for categories |
| `defaultSettings` | `Partial<Settings>` | Default visible hours and working hours per day |

## Types

```ts
interface Block {
  id: string
  categoryId: string
  employeeId: string
  date: Date
  startH: number   // 0-24, decimal for minutes
  endH: number
  employee: string // display name
  status: "draft" | "published"
}

type ResourceKind = "category" | "employee"

interface Resource {
  id: string
  name: string
  colorIdx: number  // index into categoryColors (0-7)
  kind: ResourceKind
  categoryId?: string  // required when kind === "employee"
  avatar?: string     // optional; used when kind === "employee"
}

interface SchedulerLabels {
  category?: string
  employee?: string
  shift?: string
  staff?: string
  roster?: string
  addShift?: string
  publish?: string
  draft?: string
  published?: string
  selectStaff?: string
  copyLastWeek?: string
  fillFromSchedules?: string
  publishAll?: string
  roles?: string
}
```

## Day View & Week View Usage

### Day view

- **Scroll horizontally** to navigate through days. The date in the navigator updates as you scroll.
- **Click a date** in the calendar popover (or use prev/next) to jump to that date; the view scrolls to center it.
- **Visible hours** control which hours appear (e.g., 7am–5pm). Hours outside the range are hidden.
- **Time labels**: At default zoom you see hourly labels (7am, 8am, 9am…). When you **zoom in** (zoom ≥ 1.25), labels switch to **30‑minute intervals** (7:00, 7:30, 8:00…) for finer placement. Shifts still snap to 30‑minute increments.
- **Drag shifts between days**: Drag an existing shift to another day; its start/end time is preserved on the new day.
- Use the **zoom** controls (+/−) in the header to change scale and time granularity.

### Week view

- **Scroll horizontally** to navigate weeks. The date range in the navigator stays in sync with the visible week.
- **Time labels** are zoom-based: **1‑hour** gap when zoomed in (7am, 8am, 9am…), **2‑hour** at default zoom (7am, 9am, 11am…), **4‑hour** when zoomed out (7am, 11am, 3pm…) so labels fit in narrow columns.
- **Scroll near the left or right edge** (with buffer) to load the previous or next week and keep scrolling.
- **Double‑click** a date header to switch to day view for that date. Headers show month and day (e.g. “Mar Tue 17”).
- **Visible hours** restrict the time range shown for each day.

## What's New

### 0.3.0

- **Zoom-based time intervals**: Day view shows 30‑minute labels when zoomed in; week view uses 1h / 2h / 4h label gaps depending on zoom so labels stay readable (including when zoomed out with narrow columns).
- **Drag shifts between days**: Move existing shifts to another day in day or week view; duration is preserved when moving across days.
- **Week view scroll sync**: Header date range updates as you scroll; scroll near the edge to load previous/next week without losing position.
- **Month view “+X more”**: Hover to see overflow shifts; click to open a dialog with all shifts for that day, grouped by category with times.
- **Year view**: Scheduled dates use a clearer highlight so they stand out.
- **Double‑click navigation**: Month date → week view; week date → day view.
- **Prefetching API**: `bufferDays`, `onVisibleRangeChange`, and `prefetchThreshold` for large or API-backed data.
- **Now line**: Dimmed (muted) so it’s visible but not distracting.
- **Week view headers**: Month name added (e.g. “Mar Tue 17”).

### 0.2.0

- **Day view**: 31-day horizontal timeline with infinite scroll, hour labels per day, and date sync with the navigator
- **Week view**: Time labels under each date (7am, 9am, 11am…) and wider columns
- **Badge variant**: New options—Drag & drop, Resizable, or Both—instead of Dot/Background/Both
- **Visible hours**: Day view now only shows the selected time range (e.g., 10am–5pm)
- **Add (+) button**: Fixed at the bottom of each cell, always visible
- **Settings**: Gear icon moved from footer to header next to actions

See [CHANGELOG.md](./CHANGELOG.md) for full details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

## Demo

A live demo is available at: **https://sushilldhakal.github.io/scheduler/**

To run the demo locally:
```bash
npm run demo        # Dev server
npm run demo:build  # Build for GitHub Pages (outputs to docs/)
```

## Publishing

The package is published to both **public npm** and **GitHub Packages**.

### Prerequisites

- **npm (public)**: `npm login` and ensure you have publish access
- **GitHub Packages**: Add to `~/.npmrc`:
  ```
  @sushill:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
  ```
  Create a token at GitHub → Settings → Developer settings → Personal access tokens (read:packages, write:packages)

### Publish to both registries

```bash
npm version patch   # or minor, major
npm run publish:all
git push && git push --tags
```

### Publish to one registry only

```bash
npm run publish:npm     # public npm (registry.npmjs.org)
npm run publish:github  # GitHub Packages
```

### Install from either source

- **From npm**: `npm install @sushill/shadcn-scheduler`
- **From GitHub Packages**: Configure `.npmrc` as above, then `npm install @sushill/shadcn-scheduler`

## License

MIT
