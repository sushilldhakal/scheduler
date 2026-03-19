# shadcn-scheduler

[![npm version](https://img.shields.io/npm/v/@sushill/shadcn-scheduler.svg)](https://www.npmjs.com/package/@sushill/shadcn-scheduler) [![npm](https://img.shields.io/npm/dm/@sushill/shadcn-scheduler)](https://www.npmjs.com/package/@sushill/shadcn-scheduler)

A flexible shift scheduling component for React, designed to work seamlessly with **shadcn UI**, **Tailwind CSS**, and **lucide-react** icons. Published on [npm](https://www.npmjs.com/package/@sushill/shadcn-scheduler).

## Monorepo structure

```
scheduler/
├── packages/
│   └── shadcn-scheduler/   # NPM package
├── apps/
│   └── demo/               # Demo app (GitHub Pages)
├── docs/                   # Built demo output
└── package.json            # Root workspace
```

## Features

- **Multiple views**: Day, Week, Month, and Year
- **Day view**: Infinite horizontal scroll with 31 days, hour labels per day, date sync with navigator
- **Week view**: Time labels (7am, 9am, 11am…) below each date, wider columns
- **List view**: Compact list with drag-to-reorder
- **Drag & drop**: Move shifts between categories and time slots; configurable drag vs resize behavior
- **Staff panel**: Drag employees from unscheduled list onto the grid
- **Draft/Published**: Shifts can be in draft (hidden from staff) or published
- **Category-based**: Organize shifts by categories (e.g., Department, Team, Role—fully configurable)
- **Configurable labels**: Rename Category, Employee, Shift, Staff, and more via props
- **Provider pattern**: Wrap with `SchedulerProvider` for shared config across multiple schedulers
- **Visible hours**: Restrict day/week view to a time range (e.g., 7am–5pm)
- **Add-shift button**: Fixed at bottom of each cell, always visible

## Installation

### 1. Install the package (npm)

From the public npm registry (recommended):

```bash
npm install @sushill/shadcn-scheduler
```

The package is also available from **GitHub Packages**. To use it from there, add to `~/.npmrc`: `@sushill:registry=https://npm.pkg.github.com` and authenticate with a GitHub token, then run the same install command.

### 2. Install peer dependencies

If you're using **shadcn UI**, you likely already have most of these. Ensure you have:

```bash
npm install react react-dom lucide-react tailwindcss
npm install @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle-group @radix-ui/react-checkbox @radix-ui/react-slot @radix-ui/react-context-menu
npm install react-day-picker react-resizable-panels class-variance-authority clsx tailwind-merge
```

Or with a single command:

```bash
npm install @sushill/shadcn-scheduler react react-dom lucide-react tailwindcss @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle-group @radix-ui/react-checkbox @radix-ui/react-slot @radix-ui/react-context-menu react-day-picker react-resizable-panels class-variance-authority clsx tailwind-merge
```

### 3. Configure Tailwind

Add the package to your Tailwind `content` paths so its styles are processed:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@sushill/shadcn-scheduler/dist/**/*.js",
  ],
  // ... rest of your config
}
```

### 4. shadcn CSS variables

The scheduler uses shadcn's design tokens. If you use shadcn UI, your `globals.css` already has these. If not, add the base CSS variables (e.g. by running `npx shadcn@latest init`) or include minimal variables like:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
  }
}
```

## Usage

### Option 1: Use Scheduler directly

The `Scheduler` component wraps its content in `SchedulerProvider` internally. Pass categories, employees, shifts, and optional config:

```tsx
import { useState } from "react"
import { Scheduler, type Shift, type Category, type Employee } from "@sushill/shadcn-scheduler"

const categories: Category[] = [
  { id: "c1", name: "Front Desk", colorIdx: 0 },
  { id: "c2", name: "Kitchen", colorIdx: 1 },
]

const employees: Employee[] = [
  { id: "e1", name: "Alice B.", categoryId: "c1", avatar: "AB", colorIdx: 0 },
  { id: "e2", name: "Tom H.", categoryId: "c1", avatar: "TH", colorIdx: 0 },
  { id: "e3", name: "Chef Marco", categoryId: "c2", avatar: "CM", colorIdx: 1 },
]

const initialShifts: Shift[] = [
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
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)

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
| `categories` | `Category[]` | Yes* | List of categories (e.g., Department, Team) |
| `employees` | `Employee[]` | Yes* | List of employees with `categoryId` linking to a category |
| `shifts` | `Shift[]` | Yes | Current shifts (controlled) |
| `onShiftsChange` | `(shifts: Shift[]) => void` | Yes | Called when shifts change |
| `config` | `SchedulerConfig` | No | Labels, category colors, default settings |
| `settings` | `Partial<Settings>` | No | Override visible hours, working hours per day |
| `initialView` | `string` | No | `"day"`, `"week"`, `"month"`, `"year"` (default: `"week"`) |
| `initialDate` | `Date` | No | Initial date to display |
| `headerActions` | `ReactNode` or `(actions) => ReactNode` | No | Custom buttons before Add Shift. Pass a function to get `copyLastWeek`, `publishAllDrafts`, `draftCount` |
| `footerSlot` | `(ctx) => ReactNode` | No | Renders in header next to actions. `ctx.onSettingsChange` updates visible hours, working hours, shift badge style |

\* When using `SchedulerProvider`, `categories` and `employees` can be provided at the provider level instead.

### SchedulerProvider

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `categories` | `Category[]` | Yes | Categories for all child schedulers |
| `employees` | `Employee[]` | Yes | Employees for all child schedulers |
| `config` | `SchedulerConfig` | No | Labels, colors, default settings |
| `nextUidFn` | `() => string` | No | Custom ID generator for new shifts |
| `children` | `ReactNode` | Yes | Child components (e.g. `<Scheduler />`) |

### SchedulerConfig

| Field | Type | Description |
|-------|------|-------------|
| `labels` | `Partial<SchedulerLabels>` | Custom labels: `category`, `employee`, `shift`, `staff`, `roster`, `addShift`, `publish`, `draft`, `published`, etc. |
| `categoryColors` | `CategoryColor[]` | Custom color palette for categories |
| `defaultSettings` | `Partial<Settings>` | Default visible hours and working hours per day |

## Types

```ts
interface Shift {
  id: string
  categoryId: string
  employeeId: string
  date: Date
  startH: number   // 0-24, decimal for minutes
  endH: number
  employee: string // display name
  status: "draft" | "published"
}

interface Category {
  id: string
  name: string
  colorIdx: number  // index into categoryColors (0-7)
}

interface Employee {
  id: string
  name: string
  categoryId: string  // category id
  avatar: string      // short label, e.g. "AB"
  colorIdx: number
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
- Each day block shows hour labels (7am, 8am, 9am…) in the header.

### Week view

- **Scroll horizontally** to navigate weeks. The date range in the navigator updates.
- **Time labels** (7am, 9am, 11am…) appear below each date with 2-hour intervals.
- **Visible hours** restrict the time range shown for each day.

## What's New in 0.4.0

- **Row mode**: Category vs individual — one row per employee under collapsible category headers
- **Right-click context menu**: Edit, Copy, Cut, Delete on shift blocks (Cut + Ctrl+V to paste)
- **Hover popover**: Employee, time range, duration, break info, conflict warning on block hover
- **2D free drag**: Block follows cursor; vertical edge-scroll; 4px drag threshold
- **Break support**: `breakStartH` / `breakEndH` on blocks with modal editing
- **Sidebar**: Resizable handle, sortable columns, capacity bar per category
- **Webhook callbacks**: `onBlockCreate`, `onBlockDelete`, `onBlockMove`, `onBlockResize`, `onBlockPublish`, `onAuditEvent`

See [CHANGELOG.md](./CHANGELOG.md) for full details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

## Demo

A live demo is available at: **https://sushilldhakal.github.io/scheduler/**

To run the demo locally:
```bash
npm run demo        # Build package + dev server (apps/demo)
npm run demo:build  # Build package + demo for GitHub Pages (outputs to docs/)
```

## Publishing to npm

The package is published to the **public npm registry** and optionally to **GitHub Packages**.

### Prerequisites for npm

1. **npm account**: Create one at [npmjs.com/signup](https://www.npmjs.com/signup) if needed.
2. **Login**: From the repo root or `packages/shadcn-scheduler`, run:
   ```bash
   npm login
   ```
   Use your npm username, password, and email (or use a token from npm → Access Tokens).
3. **Scoped package**: `@sushill/shadcn-scheduler` is a scoped package. The first time you publish, use `--access public` (the `publish:npm` script already includes this).

### Publish to npm (recommended)

From the repo root:

```bash
# 1. Bump version (in packages/shadcn-scheduler)
cd packages/shadcn-scheduler && npm version patch   # or minor, major
cd ../..

# 2. Build and publish to npm
npm run publish:npm

# 3. Push version tag
git push && git push --tags
```

Or bump version manually in `packages/shadcn-scheduler/package.json`, then run `npm run publish:npm`.

### Publish to both npm and GitHub Packages

```bash
npm run publish:all
git push && git push --tags
```

For GitHub Packages you need `~/.npmrc`:

```
@sushill:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Create a token at GitHub → Settings → Developer settings → Personal access tokens (read:packages, write:packages).

### Publish to GitHub Packages only

```bash
npm run publish:github
```

### Install for users

- **From npm**: `npm install @sushill/shadcn-scheduler` (no extra config)
- **From GitHub Packages**: Set `@sushill:registry=https://npm.pkg.github.com` and auth in `~/.npmrc`, then `npm install @sushill/shadcn-scheduler`

## License

MIT
