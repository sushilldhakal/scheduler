import { RootProvider } from 'fumadocs-ui/provider/next';
import { WidthProvider } from '@/components/docs/width-context';
import { DocsHeader } from '@/components/docs/header';
import './global.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <WidthProvider>
            <DocsHeader />
            {children}
          </WidthProvider>
        </RootProvider>
      </body>
    </html>
  );
}

