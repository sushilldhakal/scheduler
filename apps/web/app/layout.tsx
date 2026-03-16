import { RootProvider } from 'fumadocs-ui/provider/next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/docs/header'
import { WidthProvider } from '@/components/docs/width-context'
import { Inter } from 'next/font/google'
import '@sushill/shadcn-scheduler/tokens'
import './global.css'
import type { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <RootProvider>
          <WidthProvider>
            <TooltipProvider>
              <Header />
              {children}
            </TooltipProvider>
          </WidthProvider>
        </RootProvider>
      </body>
    </html>
  )
}