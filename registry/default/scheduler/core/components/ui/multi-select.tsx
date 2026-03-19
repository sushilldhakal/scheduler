import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cn } from "../../lib/utils"

export interface GroupedOption {
  heading: string
  options: { label: string; value: string; icon?: () => React.ReactNode; meta?: Record<string, unknown> }[]
}

interface MultiSelectProps {
  options: GroupedOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: React.ReactNode
  searchable?: boolean
  className?: string
  maxCount?: number
  /** Show a "Select all" checkbox at the top of the dropdown. */
  showSelectAll?: boolean
  /** Custom render for selected values (e.g. overlapping badges). If not provided, falls back to default text. */
  renderSelected?: (value: string[], options: GroupedOption[]) => React.ReactNode
}

const allValuesFromOptions = (opts: GroupedOption[]) =>
  opts.flatMap((g) => g.options.map((o) => o.value))

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchable = false,
  className,
  maxCount = 3,
  showSelectAll = false,
  renderSelected,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const toggle = (v: string) => {
    const next = value.includes(v)
      ? value.filter((x) => x !== v)
      : [...value, v]
    onValueChange(next)
  }

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            g.heading.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.options.length > 0)
  }, [options, search])

  const displayContent =
    value.length === 0
      ? placeholder
      : renderSelected
        ? renderSelected(value, options)
        : value.length <= maxCount
          ? value
              .map(
                (v) =>
                  options
                    .flatMap((g) => g.options)
                    .find((o) => o.value === v)?.label ?? v
              )
              .join(", ")
          : `${value.length} selected`

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("flex min-w-0 flex-1 items-center", !renderSelected && "truncate text-left")}>
            {displayContent}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-50 w-[--radix-popover-trigger-width] rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none"
        >
          {searchable && (
            <div className="relative mb-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded border border-input bg-background py-1.5 pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          {showSelectAll && filtered.length > 0 && (() => {
            const allInFiltered = allValuesFromOptions(filtered)
            const allSelected = allInFiltered.length > 0 && allInFiltered.every((v) => value.includes(v))
            return (
              <div className="border-b border-border px-2 py-1.5 mb-1">
                <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <CheckboxPrimitive.Root
                    checked={allSelected}
                    onCheckedChange={() => {
                      onValueChange(allSelected ? [] : allInFiltered)
                    }}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary"
                  >
                    <CheckboxPrimitive.Indicator>
                      <Check className="h-3 w-3" />
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Root>
                  <span>{allSelected ? "Deselect all" : "Select all"}</span>
                </label>
              </div>
            )
          })()}
          <div className="max-h-60 overflow-auto">
            {filtered.map((group) => (
              <div key={group.heading} className="py-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {group.heading}
                </div>
                {group.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <CheckboxPrimitive.Root
                      checked={value.includes(opt.value)}
                      onCheckedChange={() => toggle(opt.value)}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary"
                    >
                      <CheckboxPrimitive.Indicator>
                        <Check className="h-3 w-3" />
                      </CheckboxPrimitive.Indicator>
                    </CheckboxPrimitive.Root>
                    {opt.icon && (
                      <span className="flex shrink-0">{opt.icon()}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
