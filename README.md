# shadcn-scheduler

A flexible shift scheduling component for React, designed to work seamlessly with **shadcn UI**, **Tailwind CSS**, and **lucide-react** icons.

## Features

- **Multiple views**: Day, Week, Month, and Year
- **List view**: Compact list with drag-to-reorder
- **Drag & drop**: Move shifts between categories and time slots, resize shifts
- **Staff panel**: Drag employees from unscheduled list onto the grid
- **Draft/Published**: Shifts can be in draft (hidden from staff) or published
- **Category-based**: Organize shifts by categories (e.g., Department, Team, Role—fully configurable)
- **Configurable labels**: Rename Category, Employee, Shift, Staff, and more via props
- **Provider pattern**: Wrap with `SchedulerProvider` for shared config across multiple schedulers

## Installation

### 1. Install the package

```bash
npm install shadcn-scheduler
```

### 2. Install peer dependencies

If you're using **shadcn UI**, you likely already have most of these. Ensure you have:

```bash
npm install react react-dom lucide-react tailwindcss
npm install @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle-group @radix-ui/react-checkbox @radix-ui/react-slot
npm install react-day-picker class-variance-authority clsx tailwind-merge
```

Or with a single command:

```bash
npm install shadcn-scheduler react react-dom lucide-react tailwindcss @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-toggle-group @radix-ui/react-checkbox @radix-ui/react-slot react-day-picker class-variance-authority clsx tailwind-merge
```

### 3. Configure Tailwind

Add the package to your Tailwind `content` paths so its styles are processed:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/shadcn-scheduler/dist/**/*.js",
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
import { Scheduler, type Shift, type Category, type Employee } from "shadcn-scheduler"

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
      config={{
        labels: { category: "Department", employee: "Staff" },
        defaultSettings: {
          visibleFrom: 8,
          visibleTo: 22,
        },
      }}
    />
  )
}
```

### Option 2: Use SchedulerProvider for multiple schedulers

When you need multiple scheduler instances sharing the same config:

```tsx
import { SchedulerProvider, Scheduler } from "shadcn-scheduler"

<SchedulerProvider
  categories={categories}
  employees={employees}
  config={config}
  nextUidFn={() => `id-${Date.now()}`}
>
  <Scheduler shifts={shifts} onShiftsChange={setShifts} />
</SchedulerProvider>
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
| `onFillFromSchedules` | `() => void` | No | Callback for "Fill from Schedules" roster action |

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

## License

MIT
