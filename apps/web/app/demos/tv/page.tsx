'use client'
import { useState, useEffect } from 'react'
import { SchedulerTV, type Block } from '@sushill/shadcn-scheduler/tv'
import { channels, channelEmployees, programmes } from '@/lib/demo/tvData'
import { DemoShell } from '../_demoShell'

export default function TvDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [progs, setProgs] = useState<Block[]>(programmes)

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="TV Guide — EPG (2 Days)" description="6 channels · 48 hours · packed wall-to-wall from midnight to midnight" docsHref="/docs/examples/preset-tv">
      {mounted && initialDate ? (
        <SchedulerTV
          categories={channels}
          employees={channelEmployees}
          shifts={progs}
          onShiftsChange={setProgs}
          initialDate={initialDate}
          initialZoom={1}
          bufferDays={1}
          config={{ defaultSettings: { visibleFrom: 0, visibleTo: 24 }, snapMinutes: 15 }}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
