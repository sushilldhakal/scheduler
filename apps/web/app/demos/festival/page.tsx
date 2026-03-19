'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { festivalStages, festivalArtists, festivalSets } from '@/lib/demo/festivalData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'festival',   defaultSettings: { visibleFrom: 12, visibleTo: 24 }, snapMinutes: 15 })

export default function FestivalDemo() {
  const [mounted, setMounted] = useState(false)
  const [sets, setSets] = useState<Block[]>(festivalSets)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Music Festival" description="5 stages, 8 artists, 3-day festival with evening hours" docsHref="/docs/examples/preset-festival">
      {mounted ? (
        <Scheduler categories={festivalStages} employees={festivalArtists} shifts={sets}
          onShiftsChange={setSets} initialView="week" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
