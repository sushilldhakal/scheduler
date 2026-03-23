'use client'
import { useState, useEffect } from 'react'
import { SchedulerGantt, type Block } from '@sushill/shadcn-scheduler/gantt'
import { ganttTeams, ganttMembers, ganttTasks } from '@/lib/demo/ganttData'
import { DemoShell } from '../_demoShell'

export default function GanttDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [tasks, setTasks] = useState<Block[]>(ganttTasks)

  useEffect(() => {
    setMounted(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day = today.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    setInitialDate(monday)
  }, [])

  return (
    <DemoShell title="Project Gantt" description="5 teams, Mon–Fri sprint — frontend, backend, design, QA, DevOps" docsHref="/docs/examples/preset-gantt">
      {mounted && initialDate ? (
        <SchedulerGantt
          categories={ganttTeams}
          employees={ganttMembers}
          shifts={tasks}
          onShiftsChange={setTasks}
          initialDate={initialDate}
          bufferDays={7}
          config={{ defaultSettings: { visibleFrom: 7, visibleTo: 18 }, snapMinutes: 60 }}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
