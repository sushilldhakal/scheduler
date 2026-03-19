'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createVenueConfig, type Block } from '@sushill/shadcn-scheduler'
import { venueSpaces, venueClients, bookings } from '@/lib/demo/venueData'
import { DemoShell } from '../_demoShell'

const config = createVenueConfig({
  defaultSettings: { visibleFrom: 8, visibleTo: 24 },
  snapMinutes: 30,
})

export default function VenueDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [bks, setBks] = useState<Block[]>(bookings)

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Venue Bookings" description="6 spaces packed today — ballroom, rooftop, boardrooms, garden, cinema" docsHref="/docs/examples/preset-venue">
      {mounted && initialDate ? (
        <Scheduler
          categories={venueSpaces}
          employees={venueClients}
          shifts={bks}
          onShiftsChange={setBks}
          initialView="day"
          initialDate={initialDate}
          initialZoom={2}
          config={config}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
