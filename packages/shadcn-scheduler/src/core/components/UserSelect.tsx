import React, { useMemo } from "react"
import { Users } from "lucide-react"
import { MultiSelect, type GroupedOption } from "./ui/multi-select"
import { useSchedulerContext } from "../context"

interface UserSelectProps {
  selEmps: Set<string>
  onToggle: (empId: string) => void
  onAll: () => void
  onNone: () => void
}

interface OptionMeta {
  avatar: string | undefined
  categoryName: string
  bg: string
  text: string
}

export function UserSelect({ selEmps, onToggle }: UserSelectProps): React.ReactElement {
  const { categories, employees, getColor, labels } = useSchedulerContext()

  const options: GroupedOption[] = useMemo(
    () =>
      categories.map((cat) => {
        const c = getColor(cat.colorIdx)
        return {
          heading: cat.name,
          options: employees
            .filter((e) => e.categoryId === cat.id)
            .map((emp) => ({
              label: emp.name,
              value: emp.id,
              meta: {
                avatar: emp.avatar,
                categoryName: cat.name,
                bg: c.light,
                text: c.text,
              } satisfies OptionMeta,
              icon: () => (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: c.light, color: c.text }}
                >
                  {emp.avatar}
                </div>
              ),
            })),
        }
      }),
    [categories, employees, getColor]
  )

  const selectedValues: string[] = Array.from(selEmps)

  const handleValueChange = (values: string[]): void => {
    const newSet = new Set(values)
    employees.forEach((emp) => {
      const shouldBeSelected = newSet.has(emp.id)
      const isCurrentlySelected = selEmps.has(emp.id)
      if (shouldBeSelected !== isCurrentlySelected) onToggle(emp.id)
    })
  }

  const renderSelected = (value: string[], opts: GroupedOption[]) => {
    if (value.length === 0) return null
    const allOptions = opts.flatMap((g) => g.options)
    const selectedWithMeta = value
      .map((v) => {
        const opt = allOptions.find((o) => o.value === v)
        return opt ? { ...opt, meta: opt.meta as unknown as OptionMeta } : null
      })
      .filter(Boolean) as { value: string; label: string; meta: OptionMeta }[]

    return (
      <div
        className="flex items-center -space-x-2"
        title={selectedWithMeta.map((i) => i.label).join(", ")}
      >
        {selectedWithMeta.slice(0, 5).map((item) => (
          <div
            key={item.value}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold shadow-sm ring-1 ring-border transition-transform hover:z-10 hover:scale-110"
            style={{ background: item.meta.bg, color: item.meta.text }}
          >
            {item.meta.avatar}
          </div>
        ))}
        {selectedWithMeta.length > 5 && (
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold shadow-sm ring-1 ring-border"
            title={`+${selectedWithMeta.length - 5} more`}
          >
            +{selectedWithMeta.length - 5}
          </div>
        )}
      </div>
    )
  }

  return (
    <MultiSelect
      options={options}
      onValueChange={handleValueChange}
      value={selectedValues}
      placeholder={
        <span className="flex items-center gap-2 text-muted-foreground">
          <Users size={14} className="shrink-0 opacity-70" />
          {labels.selectStaff}
        </span>
      }
      searchable={true}
      showSelectAll={true}
      className="max-w-full sm:w-48"
      renderSelected={renderSelected}
    />
  )
}
