'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createVenueConfig, type Block } from '@sushill/shadcn-scheduler'
import { venueSpaces, venueClients, bookings } from '@/lib/demo/venueData'
import { DemoShell } from '../_demoShell'
import { useWidth } from '@/components/docs/width-context'

const config = createVenueConfig({ defaultSettings: { visibleFrom: 8, visibleTo: 24 }, snapMinutes: 30 })

export default function VenueDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [bks, setBks] = useState<Block[]>(bookings)
  const { fullWidth } = useWidth()

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Venue Bookings" description="6 spaces packed today — ballroom, rooftop, boardrooms, garden, cinema" docsHref="/docs/examples/preset-venue">
      <div className={`flex flex-col h-full ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6'}`}>
        {mounted && initialDate ? (
          <Scheduler
            categories={venueSpaces}
            employees={venueClients}
            shifts={bks}
            onShiftsChange={setBks}
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
