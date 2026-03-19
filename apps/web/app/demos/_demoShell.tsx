'use client'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useWidth } from '@/components/docs/width-context'

interface DemoShellProps {
  title: string
  description: string
  docsHref: string
  children: React.ReactNode
}

export function DemoShell({ title, description, docsHref, children }: DemoShellProps) {
  const { fullWidth } = useWidth()

  const containerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6'

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header bar */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className={`${containerClass} flex items-center gap-4 py-2.5`}>
          <Link
            href="/docs/demos"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> All demos
          </Link>
          <div className="h-3 w-px bg-border" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{description}</span>
          </div>
          <Link
            href={docsHref}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ExternalLink className="h-3 w-3" /> Docs
          </Link>
        </div>
      </div>

      {/* Scheduler content */}
      <div className={`${containerClass} flex-1 min-h-0 flex flex-col`}>
        {children}
      </div>
    </div>
  )
}
