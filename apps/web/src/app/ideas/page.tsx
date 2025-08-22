"use client";
import Link from "next/link";

export default function Ideas() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-neutral-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-amber-500" />
          <span className="font-semibold tracking-tight">MakerPulse</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link className="hover:text-amber-400" href="/dashboard">Dashboard</Link>
          <Link className="hover:text-amber-400" href="/trends">Trends</Link>
          <Link className="text-amber-400" href="/ideas">Ideas</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Ideas & Drafts</h1>
          <p className="mt-2 text-neutral-400">Generated content ideas based on your attention data.</p>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-neutral-300">Ideas and drafts will appear here after you generate them from the dashboard.</p>
          <Link 
            href="/dashboard"
            className="inline-block mt-4 px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
