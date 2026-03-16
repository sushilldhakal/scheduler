"use client"

import React, { useState, useCallback } from "react"
import {
  Scheduler,
  SchedulerProvider,
  createSchedulerConfig,
  type Block,
  type Resource,
} from "@sushill/shadcn-scheduler"

const defaultCategories: Resource[] = [
  { id: "cat-1", name: "Delivery", colorIdx: 0, kind: "category" },
  { id: "cat-2", name: "Kitchen", colorIdx: 1, kind: "category" },
]
const defaultEmployees: Resource[] = [
  { id: "emp-1", name: "Alex", categoryId: "cat-1", avatar: "", colorIdx: 0, kind: "employee" },
  { id: "emp-2", name: "Sam", categoryId: "cat-1", avatar: "", colorIdx: 1, kind: "employee" },
]

export function SchedulerBlock() {
  const [shifts, setShifts] = useState<Block[]>([])
  const config = createSchedulerConfig({ initialScrollToNow: true })
  const handleShiftsChange = useCallback((next: Block[]) => setShifts(next), [])

  return (
    <SchedulerProvider
      categories={defaultCategories}
      employees={defaultEmployees}
      config={config}
    >
      <div className="h-[600px] w-full">
        <Scheduler
          shifts={shifts}
          onShiftsChange={handleShiftsChange}
          config={config}
        />
      </div>
    </SchedulerProvider>
  )
}
