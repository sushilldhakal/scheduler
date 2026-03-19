'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createConferenceConfig, type Block } from '@sushill/shadcn-scheduler'
import { conferenceRooms, conferenceSpeakers, conferenceSessions } from '@/lib/demo/conferenceData'
import { DemoShell } from '../_demoShell'
import { useWidth } from '@/components/docs/width-context'

const config = createConferenceConfig({ defaultSettings: { visibleFrom: 8, visibleTo: 20 }, snapMinutes: 15 })

export default function ConferenceDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [sessions, setSessions] = useState<Block[]>(conferenceSessions)
  const { fullWidth } = useWidth()

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Conference Schedule" description="6 rooms packed back-to-back — keynotes, workshops, breakouts" docsHref="/docs/examples/preset-conference">
      <div className={`flex flex-col h-full ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6'}`}>
        {mounted && initialDate ? (
          <Scheduler
            categories={conferenceRooms}
            employees={conferenceSpeakers}
            shifts={sessions}
            onShiftsChange={setSessions}
            initialView="day"
            initialDate={initialDate}
            initialZoom={2}
            config={config}
          />
        ) : <div className="w-full h-full animate-pulse bg-muted" />}
      </div>
    </DemoShell>
  )
}
