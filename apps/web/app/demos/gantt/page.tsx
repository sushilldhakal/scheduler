'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { ganttTeams, ganttMembers, ganttTasks } from '@/lib/demo/ganttData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'gantt',      defaultSettings: { visibleFrom: 7,  visibleTo: 18 }, snapMinutes: 60 })

export default function GanttDemo() {
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Block[]>(ganttTasks)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Project Gantt" description="5 teams, sprint tasks, full-day blocks across frontend, backend, design, QA, DevOps" docsHref="/docs/examples/preset-gantt">
      {mounted ? (
        <Scheduler categories={ganttTeams} employees={ganttMembers} shifts={tasks}
          onShiftsChange={setTasks} initialView="week" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
