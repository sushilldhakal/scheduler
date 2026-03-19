'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'roster', snapMinutes: 30 })
  }, [])

  return (
    <DemoShell title="Workforce Roster" description="Shift scheduling with drag & drop, publish workflow, and conflict detection" docsHref="/docs/examples/roster">
      {mounted && initialDate ? (
        <Scheduler
          categories={categories}
          employees={employees}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          initialDate={initialDate}
          config={config}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
