"use client";
import Link from "next/link";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-amber-500" />
          <span className="font-semibold tracking-tight">MakerPulse</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <Link className="text-amber-400" href="/dashboard">Dashboard</Link>
            <Link className="hover:text-amber-400 text-neutral-600 dark:text-neutral-300" href="/history">History</Link>
            <Link className="hover:text-amber-400 text-neutral-600 dark:text-neutral-300" href="/ideas">Ideas</Link>
            <Link className="hover:text-amber-400 text-neutral-600 dark:text-neutral-300" href="/settings">Settings</Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Your content creation command center.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-3">Ideas & Drafts</h3>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-4">
              View and generate content ideas based on your browsing patterns.
            </p>
            <Link 
              href="/ideas"
              className="inline-block px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium"
            >
              View Ideas
            </Link>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-3">Browse History</h3>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-4">
              View your browsing history with AI-powered analysis.
            </p>
            <Link 
              href="/history"
              className="inline-block px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300"
            >
              View History
            </Link>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-3">Settings</h3>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-4">
              Configure your extension and check system status.
            </p>
            <Link 
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300"
            >
              <Settings className="h-4 w-4" />
              Open Settings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}