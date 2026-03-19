'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { venueSpaces, venueClients, bookings } from '@/lib/demo/venueData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'venue', defaultSettings: { visibleFrom: 8, visibleTo: 24 }, snapMinutes: 30 })
  }, [])

  return (
    <DemoShell title="Venue Bookings" description="6 spaces packed today — ballroom, rooftop, boardrooms, garden, cinema" docsHref="/docs/examples/preset-venue">
      {mounted && initialDate ? (
        <Scheduler
          categories={venueSpaces}
          employees={venueClients}
          shifts={bks}
          onShiftsChange={setBks}
          initialView="timeline"
          initialDate={initialDate}
          config={config}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
