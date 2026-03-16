import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { Inter } from 'next/font/google'
import '@sushill/shadcn-scheduler/tokens'
import './global.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

