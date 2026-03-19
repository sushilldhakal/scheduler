'use client'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface DemoShellProps {
  title: string
  description: string
  docsHref: string
  children: React.ReactNode
}

export function DemoShell({ title, description, docsHref, children }: DemoShellProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header bar */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-2.5 shrink-0 bg-background/95 backdrop-blur">
        <Link href="/docs/demos"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> All demos
        </Link>
        <div className="h-3 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{description}</span>
        </div>
        <Link href={docsHref}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ExternalLink className="h-3 w-3" /> Docs
        </Link>
      </div>
      {/* Full height scheduler */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
