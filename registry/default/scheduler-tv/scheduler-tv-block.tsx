"use client"

import React, { useState, useCallback } from "react"
import { SchedulerProvider } from "@sushill/shadcn-scheduler"
import { SchedulerTV, type Block, type Resource } from "@sushill/shadcn-scheduler/tv"

const defaultChannels: Resource[] = [
  { id: "ch-1", name: "Channel A", colorIdx: 0, kind: "category" },
  { id: "ch-2", name: "Channel B", colorIdx: 1, kind: "category" },
]
const defaultPrograms: Resource[] = [
  { id: "prog-1", name: "Morning Show", categoryId: "ch-1", avatar: "", colorIdx: 0, kind: "employee" },
  { id: "prog-2", name: "News Hour", categoryId: "ch-1", avatar: "", colorIdx: 1, kind: "employee" },
]

export function SchedulerTVBlock() {
  const [shifts, setShifts] = useState<Block[]>([])
  const handleShiftsChange = useCallback((next: Block[]) => setShifts(next), [])

  return (
    <SchedulerProvider
      categories={defaultChannels}
      employees={defaultPrograms}
    >
      <div className="h-[600px] w-full">
        <SchedulerTV
          shifts={shifts}
          onShiftsChange={handleShiftsChange}
          initialView="timeline"
        />
      </div>
    </SchedulerProvider>
  )
}
