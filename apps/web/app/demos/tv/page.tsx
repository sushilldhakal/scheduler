'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { channels, channelEmployees, programmes } from '@/lib/demo/tvData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'tv', defaultSettings: { visibleFrom: 6, visibleTo: 24 }, snapMinutes: 15 })
  }, [])

  return (
    <DemoShell title="TV / EPG Guide" description="6 channels packed wall-to-wall from 6am to midnight" docsHref="/docs/examples/preset-tv">
      {mounted && initialDate ? (
        <Scheduler
          categories={channels}
          employees={channelEmployees}
          shifts={progs}
          onShiftsChange={setProgs}
          initialView="timeline"
          initialDate={initialDate}
          config={config}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
