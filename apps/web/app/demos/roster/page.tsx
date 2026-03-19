'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createRosterConfig, type Block } from '@sushill/shadcn-scheduler'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { DemoShell } from '../_demoShell'

const config = createRosterConfig({ initialScrollToNow: true, snapMinutes: 30 })

export default function RosterDemo() {
  const [mounted, setMounted] = useState(false)
  const [shifts, setShifts] = useState<Block[]>(testShifts)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Workforce Roster" description="Shift scheduling with drag & drop, publish workflow, and conflict detection" docsHref="/docs/examples/roster">
      {mounted ? (
        <Scheduler categories={categories} employees={employees} shifts={shifts}
          onShiftsChange={setShifts} initialView="week" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
