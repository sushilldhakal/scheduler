'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { conferenceRooms, conferenceSpeakers, conferenceSessions } from '@/lib/demo/conferenceData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'conference', defaultSettings: { visibleFrom: 8, visibleTo: 20 }, snapMinutes: 15 })

export default function ConferenceDemo() {
  const [mounted, setMounted] = useState(false)
  const [sessions, setSessions] = useState<Block[]>(conferenceSessions)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Conference Schedule" description="6 rooms, 8 speakers, sessions across two days" docsHref="/docs/examples/preset-conference">
      {mounted ? (
        <Scheduler categories={conferenceRooms} employees={conferenceSpeakers} shifts={sessions}
          onShiftsChange={setSessions} initialView="day" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
