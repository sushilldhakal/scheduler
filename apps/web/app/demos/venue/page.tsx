'use client'
import { useState, useEffect } from 'react'
import { SchedulerVenue, type Block } from '@sushill/shadcn-scheduler/venue'
import { venueSpaces, venueClients, bookings } from '@/lib/demo/venueData'
import { DemoShell } from '../_demoShell'

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
        <SchedulerVenue
          categories={venueSpaces}
          employees={venueClients}
          shifts={bks}
          onShiftsChange={setBks}
          initialDate={initialDate}
          initialZoom={2}
          bufferDays={3}
          config={{ defaultSettings: { visibleFrom: 8, visibleTo: 24 }, snapMinutes: 30 }}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
