'use client'

import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { baseOptions } from '@/lib/layout.shared'
import { useWidth } from '@/components/docs/width-context'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import { useMemo, memo } from 'react'

const SidebarBorder = memo(() => (
  <div className="absolute top-12 right-2 bottom-0 hidden h-full w-px bg-linear-to-b from-transparent via-border to-transparent lg:flex" />
))
SidebarBorder.displayName = 'SidebarBorder'

interface DocsLayoutClientProps {
  children: ReactNode
  tree: any
}

export const DocsLayoutClient = memo(function DocsLayoutClient({
  children,
  tree,
}: DocsLayoutClientProps) {
  const { fullWidth } = useWidth()

  const sidebarConfig = useMemo(
    () => ({
      collapsible: false,
      defaultOpenLevel: 0,
      style: { '--fd-sidebar-width': '268px' } as React.CSSProperties,
      className: 'top-14 bg-background border-e-0',
      banner: <SidebarBorder />,
    }),
    []
  )

  const layoutStyle = useMemo(
    () => ({
      '--fd-sidebar-width': '268px',
      '--fd-toc-width': '252px',
      ...(fullWidth ? { '--fd-layout-width': '100vw' } : {}),
    } as React.CSSProperties),
    [fullWidth]
  )

  const options = useMemo(() => baseOptions(), [])

  return (
    <div
      className={cn('w-full', !fullWidth && 'mx-auto max-w-7xl', fullWidth && 'docs-full-width')}
      style={layoutStyle}
      suppressHydrationWarning
    >
      <DocsLayout
        tree={tree}
        {...options}
        nav={{ enabled: false, title: null }}
        themeSwitch={{ enabled: false }}
        sidebar={sidebarConfig}
      >
        {children}
      </DocsLayout>
    </div>
  )
})