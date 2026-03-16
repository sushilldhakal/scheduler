'use client'

import Link from 'next/link'
import { ArrowRight, CalendarClock, Grid3X3, Network } from 'lucide-react'
import { useWidth } from '@/components/docs/width-context'

export default function HomePage() {
  const { fullWidth } = useWidth()
  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6'

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/70">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[-80px] bottom-[-80px] h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          </div>

          <div className={containerClass + ' relative py-16 sm:py-20'}>
            <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr),minmax(0,1fr)] items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground mb-4 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Open source · Headless · MIT licensed</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                  Scheduling infrastructure
                  <br className="hidden sm:block" />
                  <span className="block text-primary mt-1">
                    for product teams that ship.
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                  <strong className="font-semibold text-foreground">shadcn-scheduler</strong> gives you
                  a production-ready scheduling grid for React. Build rosters, TV timelines, healthcare
                  shifts, or Gantt-style plans – all powered by your existing shadcn/ui + Tailwind
                  design tokens.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/docs/getting-started/installation"
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                  >
                    Open live demo
                  </Link>
                  <a
                    href="https://github.com/sushilldhakal/scheduler"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors"
                  >
                    View on GitHub
                  </a>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-4 text-xs text-muted-foreground">
                  <div>
                    <p className="text-lg font-semibold text-foreground">6+</p>
                    <p>Preset domains (roster, TV, conference, healthcare, Gantt, venue)</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">100%</p>
                    <p>Tailwind utilities – no custom CSS framework</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Minutes</p>
                    <p>To plug into an existing shadcn/ui app</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">MIT</p>
                    <p>License – self-host, fork, extend</p>
                  </div>
                </div>
              </div>

              {/* Visual teaser card */}
              <div className="relative">
                <div className="rounded-xl border border-border/70 bg-background/90 shadow-[0_18px_60px_rgba(15,23,42,0.35)] backdrop-blur-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/70 bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px] text-foreground/80">
                      SchedulerDefault &middot; Week view
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live timeline
                    </span>
                  </div>
                  <div className="p-3 space-y-3 text-[10px] sm:text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-medium text-foreground">Kitchen roster · Week 32</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <CalendarClock className="h-3 w-3" />
                        Auto scroll-to-now
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[10px]">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <div
                          key={d}
                          className="rounded-md border border-border/80 bg-background/80 px-1.5 py-1.5 flex flex-col gap-1"
                        >
                          <span className="text-[10px] text-muted-foreground">{d}</span>
                          <div className="h-1.5 rounded-full bg-primary/20" />
                          <div className="h-1.5 rounded-full bg-primary/40" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Drag shifts between days, resize to change duration, and let the engine handle
                      scrolling, zoom, and conflict detection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product strip */}
        <section className="border-b border-border/60 bg-background">
          <div className={containerClass + ' py-10 flex flex-wrap items-center justify-between gap-6'}>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Built for product teams
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                The same scheduler core powers rosters, TV guides, healthcare shifts, and Gantt-style
                resource planning – without dictating your backend or data model.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Grid3X3 className="h-3 w-3" />
                Day / Week / Month / Year
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <CalendarClock className="h-3 w-3" />
                Scroll-to-now &amp; zoom
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Network className="h-3 w-3" />
                Presets for TV, conference, healthcare
              </span>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="bg-background border-b border-border/60">
          <div className={containerClass + ' py-12 space-y-8'}>
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                Everything your scheduler needs.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                From multi-view timelines to drag-and-drop roster editing – shadcn-scheduler gives you
                the building blocks for serious workforce applications.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Multi-view engine
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Day, week, month, year, list, and TV timeline views sharing a common core. Scroll buffers
                  and prefetch hooks keep large rosters smooth.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Real-world shifts
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drag-and-drop placement, resize handles, conflict detection, draft vs published states,
                  and working-hours rules baked in.
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Tailwind-first theming
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uses shadcn-style HSL tokens and Tailwind utilities like{' '}
                  <code className="font-mono text-[11px]">bg-primary</code>,{' '}
                  <code className="font-mono text-[11px]">text-muted-foreground</code>, and{' '}
                  <code className="font-mono text-[11px]">border-border</code> so it matches your UI kit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick start & stack */}
        <section className="bg-muted/40 border-b border-border/60">
          <div
            className={
              containerClass +
              ' py-12 grid gap-8 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] items-start'
            }
          >
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                Running in under 5 minutes.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                The docs site doubles as a live demo. Clone the repo, build the scheduler package, and
                you&apos;re ready to explore real-world presets and examples.
              </p>
              <ol className="space-y-3 text-xs text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">01 · Clone &amp; install</span>
                  <pre className="mt-1 rounded-md bg-background px-3 py-2 overflow-x-auto text-[11px]">
                    <code>
                      git clone https://github.com/sushilldhakal/scheduler.git{'\n'}
                      cd scheduler && npm install
                    </code>
                  </pre>
                </li>
                <li>
                  <span className="font-semibold text-foreground">02 · Build the scheduler</span>
                  <pre className="mt-1 rounded-md bg-background px-3 py-2 overflow-x-auto text-[11px]">
                    <code>npm run build -w @sushill/shadcn-scheduler</code>
                  </pre>
                </li>
                <li>
                  <span className="font-semibold text-foreground">03 · Start the docs site</span>
                  <pre className="mt-1 rounded-md bg-background px-3 py-2 overflow-x-auto text-[11px]">
                    <code>npm run dev:web # http://localhost:3000</code>
                  </pre>
                </li>
              </ol>
            </div>
            <div className="rounded-lg border border-dashed border-border/70 bg-background p-4 text-xs text-muted-foreground space-y-3">
              <p className="text-[11px] font-mono text-foreground/80">
                Built with
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="font-semibold text-foreground">Next.js 16</span>{' '}
                  <span className="text-muted-foreground">· App Router + Turbopack</span>
                </li>
                <li>
                  <span className="font-semibold text-foreground">shadcn/ui</span>{' '}
                  <span className="text-muted-foreground">· Headless components + design tokens</span>
                </li>
                <li>
                  <span className="font-semibold text-foreground">Tailwind CSS</span>{' '}
                  <span className="text-muted-foreground">· Utility classes for every pixel</span>
                </li>
                <li>
                  <span className="font-semibold text-foreground">@radix-ui/react</span>{' '}
                  <span className="text-muted-foreground">
                    · Accessible primitives for dialogs, popovers, tabs
                  </span>
                </li>
                <li>
                  <span className="font-semibold text-foreground">TypeScript</span>{' '}
                  <span className="text-muted-foreground">
                    · End-to-end types for blocks, resources, and config
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-background">
          <div
            className={
              containerClass +
              ' py-10 border-t border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
            }
          >
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">
                Ready to build your scheduler?
              </h2>
              <p className="text-xs text-muted-foreground">
                Explore the docs, browse the presets, and drop the scheduler into your next project.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-xs font-medium text-background shadow-sm hover:bg-foreground/90 transition-colors"
              >
                Read the docs
              </Link>
              <Link
                href="/docs/examples/full-roster"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                View examples
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

