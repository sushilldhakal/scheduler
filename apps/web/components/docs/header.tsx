'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Sun, Moon, Maximize2, Minimize2, Github, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWidth } from '@/components/docs/width-context'

const GITHUB_URL = 'https://github.com/sushilldhakal/scheduler'

const NAV_LINKS = [
  { text: 'Docs', url: '/docs' },
  { text: 'Demo', url: '/demo' },
]

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { fullWidth, toggleFullWidth } = useWidth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (url: string) => {
    if (url === '/docs') return pathname.startsWith('/docs')
    if (url === '/demo') return pathname.startsWith('/demo')
    return pathname === url
  }

  const openSearch = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    document.dispatchEvent(event)
  }

  const headerContainerClass = fullWidth
    ? 'mx-auto w-full px-4 sm:px-6'
    : 'mx-auto max-w-7xl px-4 sm:px-6'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className={headerContainerClass}>
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity"
            >
              <span className="text-base">shadcn-scheduler</span>
            </Link>

            <nav className=" sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive(link.url)
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Search + Actions */}
          <div className="flex items-center gap-1">
            {/* Search button */}
            <button
              onClick={openSearch}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors w-48 lg:w-64 mr-2"
              aria-label="Search documentation"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Search docs...</span>
              <kbd className=" lg:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                <span>⌘K</span>
              </kbd>
            </button>

            {/* GitHub */}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              aria-label="GitHub repository"
            >
              <Github className="h-4 w-4" />
            </a>

            {/* Full-width toggle */}
            <button
              onClick={toggleFullWidth}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              aria-label={fullWidth ? 'Switch to contained width' : 'Switch to full width'}
            >
              {fullWidth ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Get Started → Installation page */}
            <Link
              href="/docs/getting-started/installation"
              className="ml-2 hidden sm:inline-flex items-center justify-center rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
