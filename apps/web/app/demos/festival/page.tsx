'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createFestivalConfig, type Block } from '@sushill/shadcn-scheduler'
import { festivalStages, festivalArtists, festivalSets } from '@/lib/demo/festivalData'
import { DemoShell } from '../_demoShell'
import { useWidth } from '@/components/docs/width-context'

const config = createFestivalConfig({ defaultSettings: { visibleFrom: 12, visibleTo: 24 }, snapMinutes: 15 })

export default function FestivalDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [sets, setSets] = useState<Block[]>(festivalSets)
  const { fullWidth } = useWidth()

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Music Festival Lineup" description="5 stages — Main Stage to Electronic Dome, packed noon to midnight" docsHref="/docs/examples/preset-festival">
      <div className={`flex flex-col h-full ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6'}`}>
        {mounted && initialDate ? (
          <Scheduler
            categories={festivalStages}
            employees={festivalArtists}
            shifts={sets}
            onShiftsChange={setSets}
            initialView="timeline"
            initialDate={initialDate}
            initialZoom={2}
            config={config}
          />
        ) : <div className="w-full h-full animate-pulse bg-muted" />}
      </div>
    </DemoShell>
  )
}
