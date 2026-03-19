'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createGanttConfig, type Block } from '@sushill/shadcn-scheduler'
import { ganttTeams, ganttMembers, ganttTasks } from '@/lib/demo/ganttData'
import { DemoShell } from '../_demoShell'

const config = createGanttConfig({ visibleFrom: 7, visibleTo: 18, snapMinutes: 60 })

export default function GanttDemo() {
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Block[]>(ganttTasks)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Project Gantt" description="Sprint planning across 5 teams with task tracking" docsHref="/docs/examples/preset-gantt">
      {mounted ? (
        <Scheduler categories={ganttTeams} employees={ganttMembers} shifts={tasks}
          onShiftsChange={setTasks} initialView="week" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
