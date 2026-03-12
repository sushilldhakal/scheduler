import React from "react"
import { ROLES, ALL_EMPLOYEES } from "../data"
import { rc } from "../constants"
import { MultiSelect } from "@/components/ui/MultiSelect"

interface UserSelectProps {
  selEmps: Set<string>
  onToggle: (empId: string) => void
  onAll: () => void
  onNone: () => void
}

interface SelectOption {
  label: string
  value: string
  icon: () => JSX.Element
}

interface GroupedOption {
  heading: string
  options: SelectOption[]
}

export function UserSelect({ selEmps, onToggle, onAll, onNone }: UserSelectProps): JSX.Element {
  // Build grouped options for MultiSelect
  const options: GroupedOption[] = ROLES.map(role => ({
    heading: role.name,
    options: ALL_EMPLOYEES.filter(e => e.role === role.id).map(emp => {
      const c = rc(role.colorIdx)
      return {
        label: emp.name,
        value: emp.id,
        icon: () => (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
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
    ALL_EMPLOYEES.forEach(emp => {
      const shouldBeSelected    = newSet.has(emp.id)
      const isCurrentlySelected = selEmps.has(emp.id)
      if (shouldBeSelected !== isCurrentlySelected) onToggle(emp.id)
    })
  }

  return (
    <MultiSelect
      options={options}
      onValueChange={handleValueChange}
      value={selectedValues}
      placeholder="Select staff"
      searchable={true}
      className="w-full md:w-64"
      maxCount={5}
      avatarView={true}
      autoSize={false}
    />
  )
}