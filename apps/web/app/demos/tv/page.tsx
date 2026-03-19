'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createTvConfig, type Block } from '@sushill/shadcn-scheduler'
import { channels, channelEmployees, programmes } from '@/lib/demo/tvData'
import { DemoShell } from '../_demoShell'
import { useWidth } from '@/components/docs/width-context'

const config = createTvConfig({ defaultSettings: { visibleFrom: 6, visibleTo: 24 }, snapMinutes: 15 })

export default function TvDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [progs, setProgs] = useState<Block[]>(programmes)
  const { fullWidth } = useWidth()
  const containerClass = fullWidth ? 'mx-auto w-full px-4 sm:px-6' : 'mx-auto max-w-7xl px-4 sm:px-6'

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="TV / EPG Guide" description="6 channels packed wall-to-wall from 6am to midnight" docsHref="/docs/examples/preset-tv">
      <div className={`flex flex-col h-full ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6'}`}>
        {mounted && initialDate ? (
          <Scheduler
            categories={channels}
            employees={channelEmployees}
            shifts={progs}
            onShiftsChange={setProgs}
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
