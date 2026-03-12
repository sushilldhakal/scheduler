import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cn } from "../../lib/utils"

export interface GroupedOption {
  heading: string
  options: { label: string; value: string; icon?: () => React.ReactNode }[]
}

interface MultiSelectProps {
  options: GroupedOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchable?: boolean
  className?: string
  maxCount?: number
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchable = false,
  className,
  maxCount = 3,
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

  const displayText =
    value.length === 0
      ? placeholder
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
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-50 w-[--radix-popover-trigger-width] rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none"
        >
          {searchable && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="mb-1 h-8 w-full rounded border border-input bg-background px-2 text-sm outline-none"
            />
          )}
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
