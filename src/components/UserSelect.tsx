import React from "react"
import { MultiSelect, type GroupedOption } from "./ui/multi-select"
import { useSchedulerContext } from "../context"

interface UserSelectProps {
  selEmps: Set<string>
  onToggle: (empId: string) => void
  onAll: () => void
  onNone: () => void
}

export function UserSelect({ selEmps, onToggle }: UserSelectProps): JSX.Element {
  const { categories, employees, getColor, labels } = useSchedulerContext()

  const options: GroupedOption[] = categories.map((cat) => ({
    heading: cat.name,
    options: employees
      .filter((e) => e.categoryId === cat.id)
      .map((emp) => {
        const c = getColor(cat.colorIdx)
        return {
          label: emp.name,
          value: emp.id,
          icon: () => (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: c.light, color: c.text }}
            >
              {emp.avatar}
            </div>
          ),
        }
      }),
  }))

  const selectedValues: string[] = Array.from(selEmps)

  const handleValueChange = (values: string[]): void => {
    const newSet = new Set(values)
    employees.forEach((emp) => {
      const shouldBeSelected = newSet.has(emp.id)
      const isCurrentlySelected = selEmps.has(emp.id)
      if (shouldBeSelected !== isCurrentlySelected) onToggle(emp.id)
    })
  }

  return (
    <MultiSelect
      options={options}
      onValueChange={handleValueChange}
      value={selectedValues}
      placeholder={labels.selectStaff}
      searchable={true}
      className="w-full md:w-64"
      maxCount={5}
    />
  )
}
