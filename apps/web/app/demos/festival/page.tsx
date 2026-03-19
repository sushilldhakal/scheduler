'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { festivalStages, festivalArtists, festivalSets } from '@/lib/demo/festivalData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'festival', defaultSettings: { visibleFrom: 12, visibleTo: 24 }, snapMinutes: 15 })

export default function FestivalDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [sets, setSets] = useState<Block[]>(festivalSets)

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Music Festival Lineup" description="5 stages — Main Stage to Electronic Dome, packed noon to midnight" docsHref="/docs/examples/preset-festival">
      {mounted && initialDate ? (
        <Scheduler
          categories={festivalStages}
          employees={festivalArtists}
          shifts={sets}
          onShiftsChange={setSets}
          initialView="day"
          initialDate={initialDate} config={config}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
