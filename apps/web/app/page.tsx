'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import {
  Scheduler,
  createSchedulerConfig,
  type Block,
} from '@sushill/shadcn-scheduler'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { ArrowRight, Github, Check } from 'lucide-react'
import { useWidth } from '@/components/docs/width-context'

const config = createSchedulerConfig({ initialScrollToNow: true })

const domains = [
  { name: 'Roster', tag: 'Workforce', color: 'bg-blue-500' },
  { name: 'TV Guide', tag: 'Broadcasting', color: 'bg-violet-500' },
  { name: 'Conference', tag: 'Events', color: 'bg-emerald-500' },
  { name: 'Festival', tag: 'Music', color: 'bg-amber-500' },
  { name: 'Healthcare', tag: 'Rotas', color: 'bg-red-500' },
  { name: 'Gantt', tag: 'Projects', color: 'bg-cyan-500' },
  { name: 'Venue', tag: 'Bookings', color: 'bg-pink-500' },
]

const features = [
  'Drag & drop shifts across days and resources',
  'Conflict detection with red border warnings',
  'Scroll-to-now with live pulsing indicator',
  'Day / Week / Month / Year / List / Timeline views',
  'Draft & publish workflow with status banners',
  'Zoom levels from 15min to 2hr slots',
  'Fully typed with generic meta: TMeta extension',
  'Render slots for every surface — blocks, headers, tooltips',
  'Dark mode via shadcn CSS variables',
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [shifts, setShifts] = useState<Block[]>(testShifts)
  const demoRef = useRef<HTMLDivElement>(null)
  const { fullWidth } = useWidth()
  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6'
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative min-h-screen bg-background text-foreground py-16 sm:py-20">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className= "relative border-b border-border overflow-hidden">
        {/* subtle grid background */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 0.4,
          }}
        />
        <div className={containerClass + ' relative pt-20 pb-0'}>
          <div className="flex flex-col items-center text-center gap-6 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open source · MIT · shadcn native
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.05]">
              The scheduling grid
              <br />
              <span className="text-muted-foreground">for everything.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              One React component. Seven domain presets. Rosters, TV guides, conferences,
              festivals, healthcare rotas, Gantt charts, and venue bookings — all powered
              by your existing shadcn/ui tokens.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/docs/getting-started/installation"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Live demo
              </Link>
              <a
                href="https://github.com/sushilldhakal/scheduler"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" /> GitHub
              </a>
            </div>

            <div className="font-mono text-xs text-muted-foreground bg-muted border border-border rounded-lg px-4 py-2.5 select-all">
              npx shadcn@latest add scheduler
            </div>
          </div>

          {/* Live scheduler embedded in hero */}
          <div
            ref={demoRef}
            className="scheduler-wrapper rounded-t-xl border border-b-0 border-border overflow-hidden shadow-2xl"
            style={{ height: '420px' } as React.CSSProperties}
          >
            {mounted ? (
              <Scheduler
                categories={categories}
                employees={employees}
                shifts={shifts}
                onShiftsChange={setShifts}
                initialView="week"
                config={config}
              />
            ) : (
              <div className="w-full h-full bg-muted animate-pulse" />
            )}
          </div>
        </div>
      </section>

      {/* ── Domain presets ───────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className={containerClass + ' py-14'}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Seven domain presets — one engine
          </p>
          <div className="flex flex-wrap gap-3">
            {domains.map((d) => (
              <div
                key={d.name}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                <span className={`h-2 w-2 rounded-full ${d.color}`} />
                {d.name}
                <span className="text-muted-foreground text-xs">/ {d.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className={containerClass + ' py-16 grid md:grid-cols-2 gap-12 items-center'}>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Everything a production scheduler needs.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Not a toy demo. Not a stripped-down calendar. A full scheduling engine
              built for real applications — with the flexibility of shadcn and the
              power of a dedicated scheduling library.
            </p>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
            <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 bg-background">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">scheduler.tsx</span>
            </div>
            <pre className="p-5 text-xs font-mono text-foreground leading-relaxed overflow-x-auto">
{`import { Scheduler } from '@sushill/shadcn-scheduler'

// Roster preset
<Scheduler.roster
  categories={categories}
  employees={employees}
  shifts={shifts}
  onShiftsChange={setShifts}
  initialView="week"
/>

// TV guide — same component
<Scheduler.tv
  channels={channels}
  programs={programs}
  initialView="timeline"
/>

// Healthcare rota
<Scheduler.healthcare
  wards={wards}
  staff={staff}
  rotas={rotas}
/>`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className={containerClass + ' py-14 grid grid-cols-2 md:grid-cols-4 gap-8'}>
          {[
            { value: '7', label: 'Domain presets' },
            { value: '6+', label: 'View types' },
            { value: '100%', label: 'TypeScript' },
            { value: 'MIT', label: 'License' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-foreground mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick install ─────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className={containerClass + ' py-16 grid md:grid-cols-2 gap-12 items-start'}>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Running in minutes.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              If you're already on shadcn/ui, the scheduler uses your existing CSS
              variables and Tailwind setup. No new design system to learn.
            </p>
            <div className="space-y-4">
              {[
                { step: '01', title: 'Install via shadcn', code: 'npx shadcn@latest add scheduler' },
                { step: '02', title: 'Or install via npm', code: 'npm install @sushill/shadcn-scheduler' },
                { step: '03', title: 'Import the tokens', code: 'import "@sushill/shadcn-scheduler/tokens"' },
                { step: '04', title: 'Add to your page', code: '<Scheduler.roster shifts={shifts} />' },
              ].map(({ step, title, code }) => (
                <div key={step} className="flex gap-4">
                  <span className="text-xs font-mono text-muted-foreground w-6 pt-0.5 shrink-0">{step}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{title}</p>
                    <code className="block rounded-md bg-muted border border-border px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                      {code}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Built on your stack</h3>
            {[
              { name: 'shadcn/ui', desc: 'Design tokens, components, and registry' },
              { name: 'Tailwind CSS v3/v4', desc: 'Utility classes — no extra CSS framework' },
              { name: 'Radix UI', desc: 'Accessible dialogs, popovers, and tooltips' },
              { name: 'React 18+', desc: 'Client components with hooks-based state' },
              { name: 'TypeScript', desc: 'End-to-end types for blocks and resources' },
            ].map(({ name, desc }) => (
              <div key={name} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-foreground text-background">
        <div className={containerClass + ' py-16 flex flex-col md:flex-row items-center justify-between gap-8'}>
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Ready to ship your scheduler?
            </h2>
            <p className="text-background/70">
              MIT licensed. No lock-in. Works with your existing shadcn setup.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/docs/getting-started/installation"
              className="inline-flex items-center gap-2 rounded-md bg-background text-foreground px-5 py-2.5 text-sm font-semibold hover:bg-background/90 transition-colors"
            >
              Read the docs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-background/30 text-background px-5 py-2.5 text-sm font-semibold hover:bg-background/10 transition-colors"
            >
              Live demo
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}