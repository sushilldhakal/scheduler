'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import {
  Scheduler,
  createSchedulerConfig,
  type Block,
} from '@sushill/shadcn-scheduler'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { ArrowRight, Github, Check, Calendar, Users, Zap, Layers, Moon, Move, ChevronRight, Copy, Terminal, LayoutGrid } from 'lucide-react'
import { useWidth } from '@/components/docs/width-context'

const config = createSchedulerConfig({ initialScrollToNow: true })

const domains = [
  { name: 'Workforce Roster', tag: 'HR & Ops', color: '#3b82f6', desc: 'Shift scheduling, availability, and staff allocation', href: '/demos/roster' },
  { name: 'TV Guide / EPG', tag: 'Broadcasting', color: '#8b5cf6', desc: 'Electronic programme guides and channel scheduling', href: '/demos/tv' },
  { name: 'Conference', tag: 'Events', color: '#10b981', desc: 'Session, speaker, and room booking management', href: '/demos/conference' },
  { name: 'Festival', tag: 'Music', color: '#f59e0b', desc: 'Stage, artist, and set-time scheduling across days', href: '/demos/festival' },
  { name: 'Healthcare Rota', tag: 'Medical', color: '#ef4444', desc: 'Ward, shift, and on-call rota management', href: '/demos/healthcare' },
  { name: 'Gantt / Projects', tag: 'Planning', color: '#06b6d4', desc: 'Task dependencies and milestone tracking', href: '/demos/gantt' },
  { name: 'Venue Bookings', tag: 'Hospitality', color: '#ec4899', desc: 'Room, table, and facility reservation', href: '/demos/venue' },
  { name: 'Kanban Board', tag: 'Workforce', color: '#f97316', desc: 'Day/Week/Month/Year kanban with accordion categories, drag-and-drop, and timeline drill-down', href: '/demos/kanban' },
]

const features = [
  { icon: Move, title: '2D Free Drag', desc: 'Blocks lift out of their row and follow your cursor freely. Drop anywhere — across rows, days, views.' },
  { icon: Layers, title: 'Virtual Rendering', desc: '200+ staff with zero jank. TanStack virtualizer renders only visible rows at 60fps.' },
  { icon: Zap, title: 'Right-click & Bulk Actions', desc: 'Context menu with Edit, Copy, Cut, Delete. Rubber-band select multiple blocks and bulk move, publish or delete.' },
  { icon: Calendar, title: '7 View Types', desc: 'Day, Week, Month, Year, List, Timeline, Kanban. Multi-level zoom headers. Each view fully interactive.' },
  { icon: LayoutGrid, title: 'Kanban Board View', desc: 'Week grid with accordion category rows, compact shift cards, hover popover, and one-click drill-down to Day timeline.' },
  { icon: Users, title: 'Recurring Shifts', desc: 'Daily, weekly, monthly recurrence with RRULE-compatible rules. Edit single occurrence or all future.' },
  { icon: Moon, title: 'Dependencies & Markers', desc: 'SVG arrows connect related shifts. Draggable vertical markers for deadlines and milestones.' },
]

const installSteps = [
  { step: '01', cmd: 'npm install @sushill/shadcn-scheduler', label: 'Install the package' },
  { step: '02', cmd: 'import { Scheduler } from \'@sushill/shadcn-scheduler\'', label: 'Import the component' },
  { step: '03', cmd: '<Scheduler categories={...} employees={...} shifts={...} />', label: 'Drop it in your page' },
]

function AnimatedCounter({ target, suffix = '' }: { target: number, suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = target / 40
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) }
        else setCount(Math.floor(start))
      }, 30)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [shifts, setShifts] = useState<Block[]>(testShifts)
  const [copied, setCopied] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const { fullWidth } = useWidth()

  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6'

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
    const t = setInterval(() => setActiveFeature(i => (i + 1) % features.length), 3000)
    return () => clearInterval(t)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install @sushill/shadcn-scheduler')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">

      {/* ── Hero ── */}
      <section className="relative border-b border-border overflow-hidden min-h-[92vh] flex flex-col">
        {/* Grid bg */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(var(--color-border,hsl(var(--border))) 1px, transparent 1px), linear-gradient(90deg, var(--color-border,hsl(var(--border))) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.25,
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, hsl(var(--primary)/0.12) 0%, transparent 70%)' }}
        />

        <div className={`relative ${containerClass} pt-24 pb-0 flex flex-col flex-1`}>
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground"
              style={{ animation: 'fadeSlideDown 0.5s ease both' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open source · MIT · shadcn native · v0.4.0
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-8" style={{ animation: 'fadeSlideDown 0.6s 0.1s ease both' }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.02] mb-6">
              The open-source
              <br />
              <span className="text-muted-foreground/60">scheduling grid.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              One React component. Drag-and-drop shifts. 200+ staff. Zero paywalls.
              Built on shadcn/ui so it looks like the rest of your product.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10" style={{ animation: 'fadeSlideDown 0.6s 0.2s ease both' }}>
            <Link href="/docs/getting-started/installation"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 text-sm font-semibold hover:bg-foreground/90 transition-all hover:gap-3">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/demo"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
              Live demo
            </Link>
            <Link href="/demos/kanban"
              className="inline-flex items-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/5 px-6 py-3 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 transition-colors">
              <LayoutGrid className="h-4 w-4" /> Kanban view
            </Link>
            <a href="https://github.com/sushilldhakal/scheduler" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>

          {/* Install pill */}
          <div className="flex justify-center mb-12" style={{ animation: 'fadeSlideDown 0.6s 0.25s ease both' }}>
            <button onClick={handleCopy}
              className="group inline-flex items-center gap-3 rounded-xl border border-border bg-muted/50 backdrop-blur px-5 py-3 text-sm font-mono text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              npm install @sushill/shadcn-scheduler
              <Copy className={`h-3.5 w-3.5 transition-all ${copied ? 'text-emerald-500' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
          </div>

          {/* Live scheduler */}
          <div className="flex-1 min-h-0 rounded-t-2xl border border-b-0 border-border overflow-hidden shadow-2xl"
            style={{ animation: 'fadeUp 0.8s 0.3s ease both', minHeight: 400 }}>
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-amber-400/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">shadcn-scheduler — Live Demo</span>
              <Link href="/demo" className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                Open full demo <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div style={{ height: 460 }}>
              {mounted ? (
                <Scheduler
                  categories={categories}
                  employees={employees}
                  shifts={shifts}
                  onShiftsChange={setShifts}
                  initialView="week"
                  initialDate={initialDate ?? new Date()}
                  config={config}
                />
              ) : (
                <div className="w-full h-full bg-muted animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="border-b border-border bg-muted/20">
        <div className={`${containerClass} py-8 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground`}>
          <span className="flex items-center gap-2"><span className="text-2xl font-bold text-foreground"><AnimatedCounter target={8} /></span> domain presets</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2"><span className="text-2xl font-bold text-foreground"><AnimatedCounter target={7} /></span> view types</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2"><span className="text-2xl font-bold text-foreground"><AnimatedCounter target={200} suffix="+" /></span> staff virtualized</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2"><span className="text-2xl font-bold text-foreground">MIT</span> license</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2"><span className="text-2xl font-bold text-foreground">100%</span> TypeScript</span>
        </div>
      </section>

      {/* ── Domains ── */}
      <section className="border-b border-border py-20">
        <div className={containerClass}>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Seven domains. One component.</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Works for your industry</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {domains.map((d, i) => (
              <Link key={d.name} href={d.href} target="_blank"
                className="group rounded-xl border border-border bg-muted/20 p-5 hover:bg-muted/50 hover:border-border/80 transition-all hover:-translate-y-0.5 block no-underline"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: d.color + '22' }}>
                    <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.tag}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all">Open demo →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b border-border py-20 bg-muted/10">
        <div className={containerClass}>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Built for production</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything a real scheduler needs</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Not a toy demo. Not a stripped-down calendar. A full scheduling engine with the flexibility of shadcn.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              const isActive = activeFeature === i
              return (
                <div key={f.title}
                  onMouseEnter={() => setActiveFeature(i)}
                  className={`rounded-xl border p-6 transition-all cursor-default ${isActive ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:bg-muted/40'}`}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Install steps ── */}
      <section className="border-b border-border py-20">
        <div className={`${containerClass} grid lg:grid-cols-2 gap-16 items-center`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Get running fast</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Up and running in minutes</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Already on shadcn/ui? The scheduler uses your existing CSS variables and Tailwind setup.
              No new design system. No configuration files. Just install and render.
            </p>
            <div className="flex gap-3">
              <Link href="/docs/getting-started/installation"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/90 transition-colors">
                Full install guide <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs/getting-started/quick-start"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-colors">
                Quick start
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {installSteps.map(({ step, cmd, label }) => (
              <div key={step} className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-4">
                <span className="text-xs font-mono text-muted-foreground/50 shrink-0 pt-0.5">{step}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
                  <code className="block text-xs font-mono text-foreground bg-muted rounded-lg px-3 py-2 truncate border border-border/50">
                    {cmd}
                  </code>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <pre className="text-xs font-mono text-foreground leading-relaxed overflow-x-auto">{`import { Scheduler } from '@sushill/shadcn-scheduler'

export default function App() {
  const [shifts, setShifts] = useState([])
  
  return (
    <div className="h-[600px]">
      <Scheduler
        categories={categories}
        employees={employees}
        shifts={shifts}
        onShiftsChange={setShifts}
        initialView="week"
      />
    </div>
  )
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why free ── */}
      <section className="border-b border-border py-20 bg-muted/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Free forever · No paywalls · No seat licenses
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Scheduling software shouldn't cost a fortune
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
            Most scheduling components ask for hundreds of dollars per month or lock key features behind enterprise plans.
            shadcn-scheduler is MIT licensed, open source, and free to use in any project — commercial or otherwise.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { title: 'MIT Licensed', desc: 'Use it in commercial products. Modify it. Ship it. No attribution required.' },
              { title: 'No seat fees', desc: 'Works for 5 employees or 5,000. The license doesn\'t change based on your team size.' },
              { title: 'Community owned', desc: 'Open source on GitHub. File issues, send PRs, shape the roadmap.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-border bg-background p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Ready to ship?</h2>
          <p className="text-muted-foreground text-lg mb-10">
            MIT licensed. No lock-in. Works with your existing shadcn setup today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/docs/getting-started/installation"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-8 py-4 text-base font-semibold hover:bg-foreground/90 transition-all hover:gap-3 shadow-lg">
              Start building <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/demo"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-8 py-4 text-base font-semibold hover:bg-accent transition-colors">
              Try the demo
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scheduler-wrapper { animation: fadeUp 0.8s 0.3s ease both; }
      `}</style>

    </div>
  )
}
