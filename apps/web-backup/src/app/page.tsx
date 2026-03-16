import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            shadcn-scheduler
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            A flexible shift scheduling component for React with shadcn UI, Tailwind CSS, and lucide-react.
            Day, week, month, year, list, and timeline views with drag-and-drop, conflict detection, and export.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Demo
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Docs
            </Link>
            <a
              href="https://github.com/sushilldhakal/scheduler"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              View source
            </a>
          </div>
        </div>
      </main>
      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <a href="https://github.com/sushilldhakal/scheduler" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          GitHub
        </a>
        {" · "}
        <a href="https://www.npmjs.com/package/@sushill/shadcn-scheduler" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          npm
        </a>
      </footer>
    </div>
  );
}
