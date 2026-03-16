import { source } from '@/lib/source'
import { DocsLayoutClient } from './docs-layout-client'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayoutClient tree={source.getPageTree()}>
      {children}
    </DocsLayoutClient>
  )
}