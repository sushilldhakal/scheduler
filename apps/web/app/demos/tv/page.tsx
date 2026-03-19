'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createTvConfig, type Block } from '@sushill/shadcn-scheduler'
import { channels, channelEmployees, programmes } from '@/lib/demo/tvData'
import { DemoShell } from '../_demoShell'

const config = createTvConfig({ visibleFrom: 6, visibleTo: 24, snapMinutes: 15 })

export default function TvDemo() {
  const [mounted, setMounted] = useState(false)
  const [progs, setProgs] = useState<Block[]>(programmes)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="TV / EPG Guide" description="Electronic programme guide with 6 channels" docsHref="/docs/examples/preset-tv">
      {mounted ? (
        <Scheduler categories={channels} employees={channelEmployees} shifts={progs}
          onShiftsChange={setProgs} initialView="day" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
