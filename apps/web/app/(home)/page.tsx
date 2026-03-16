import Link from 'next/link';
import { HomePageContent } from '../home-page-content';

export default function HomePage() {
  return (
    <HomePageContent>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="flex flex-col items-center text-center gap-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
            Scheduler for real teams
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Ship a production-ready scheduler
            <br className="hidden md:block" />
            in minutes, not months.
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-muted-foreground">
            shadcn-scheduler gives you day, week, month, year, list, and timeline views with
            drag-and-drop, conflict detection, zoom, presets, and a headless core that fits your
            product—not the other way around.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started
            </Link>
            <Link
              href="/docs/examples/full-roster"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              View examples
            </Link>
            <a
              href="https://github.com/sushilldhakal/scheduler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Docs live at <code className="rounded bg-muted px-1.5 py-0.5">http://localhost:3002/docs</code> when running locally.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-10 border-t border-border/40">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 text-left">
            <h3 className="text-sm font-semibold mb-2">Multiple calendar views</h3>
            <p className="text-sm text-muted-foreground">
              Day, week, month, year, list, and timeline views out of the box, with sensible
              defaults and accessible keyboard interactions.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-left">
            <h3 className="text-sm font-semibold mb-2">Built for real rosters</h3>
            <p className="text-sm text-muted-foreground">
              Conflict detection, draft vs published states, zoom, scroll-to-now, and presets for
              TV, conference tracks, healthcare, and more.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-left">
            <h3 className="text-sm font-semibold mb-2">Headless & composable</h3>
            <p className="text-sm text-muted-foreground">
              Use the headless core with your own UI, or drop in the shadcn-styled components and
              ship fast with Tailwind.
            </p>
          </div>
        </div>
      </section>

      {/* How it fits */}
      <section className="py-12 border-t border-border/40">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
          <div className="space-y-4 text-left">
            <h2 className="text-xl font-semibold">Designed for product teams</h2>
            <p className="text-sm text-muted-foreground">
              Whether you're building workforce management, broadcast planning, or internal
              tooling, shadcn-scheduler gives you the primitives you need:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Typed data model for categories, resources, and shifts.</li>
              <li>Controlled component API—keep your own source of truth.</li>
              <li>Helpers for generating realistic demo data.</li>
              <li>Domain presets so you don't start from scratch.</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-5 text-left text-xs font-mono text-muted-foreground">
            <p className="mb-3 text-[0.7rem] uppercase tracking-[0.18em] text-primary/80">
              Example integration
            </p>
            <pre className="overflow-x-auto text-[0.7rem] leading-relaxed">
{`import { Scheduler } from '@sushill/shadcn-scheduler';

export function RosterPage() {
  return (
    <Scheduler
      categories={categories}
      employees={employees}
      shifts={shifts}
      onShiftsChange={setShifts}
      initialView="week"
    />
  );
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 border-t border-border/40">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-xl font-semibold">Ready to wire it into your app?</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Start with the docs, copy the full roster example, and adapt it to your domain—whether
            that's staff scheduling, event programming, or anything with time blocks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to docs
            </Link>
            <Link
              href="/docs/examples/full-roster"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Browse examples
            </Link>
          </div>
        </div>
      </section>
    </HomePageContent>
  );
}
