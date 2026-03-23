'use client'
import { useState, useEffect } from 'react'
import { SchedulerFestival, type Block } from '@sushill/shadcn-scheduler/festival'
import { festivalStages, festivalArtists, festivalSets } from '@/lib/demo/festivalData'
import { DemoShell } from '../_demoShell'

export default function FestivalDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [sets, setSets] = useState<Block[]>(festivalSets)

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Glastonbury 2025 — 3-Day Lineup" description="6 stages · 18 artists · 3 days — Main Stage to Electronic Dome" docsHref="/docs/examples/preset-festival">
      {mounted && initialDate ? (
        <SchedulerFestival
          categories={festivalStages}
          employees={festivalArtists}
          shifts={sets}
          onShiftsChange={setSets}
          initialDate={initialDate}
          initialZoom={2}
          bufferDays={2}
          config={{ defaultSettings: { visibleFrom: 12, visibleTo: 24 }, snapMinutes: 15 }}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
