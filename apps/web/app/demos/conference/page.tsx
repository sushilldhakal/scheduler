'use client'
import { useState, useEffect } from 'react'
import { SchedulerConference, type Block } from '@sushill/shadcn-scheduler/conference'
import { conferenceRooms, conferenceSpeakers, conferenceSessions } from '@/lib/demo/conferenceData'
import { DemoShell } from '../_demoShell'

export default function ConferenceDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [sessions, setSessions] = useState<Block[]>(conferenceSessions)

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="TechConf 2025 — 3-Day Schedule" description="6 rooms · 3 days · 40+ sessions — keynotes, workshops, startup stage" docsHref="/docs/examples/preset-conference">
      {mounted && initialDate ? (
        <SchedulerConference
          categories={conferenceRooms}
          employees={conferenceSpeakers}
          shifts={sessions}
          onShiftsChange={setSessions}
          initialDate={initialDate}
          initialZoom={1.5}
          bufferDays={2}
          config={{ defaultSettings: { visibleFrom: 8, visibleTo: 20 }, snapMinutes: 15 }}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
