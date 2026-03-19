'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { venueSpaces, venueClients, bookings } from '@/lib/demo/venueData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'venue',      defaultSettings: { visibleFrom: 8,  visibleTo: 24 }, snapMinutes: 30 })

export default function VenueDemo() {
  const [mounted, setMounted] = useState(false)
  const [bks, setBks] = useState<Block[]>(bookings)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Venue Bookings" description="6 spaces — Grand Ballroom, Rooftop, Boardrooms, Garden, Cinema" docsHref="/docs/examples/preset-venue">
      {mounted ? (
        <Scheduler categories={venueSpaces} employees={venueClients} shifts={bks}
          onShiftsChange={setBks} initialView="week" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
