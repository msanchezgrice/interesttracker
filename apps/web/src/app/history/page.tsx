"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

type Event = {
  id: string;
  url: string;
  title: string | null;
  domain: string;
  minutes: number;
  scrollPercent: number | null;
  tsStart: string;
  tsEnd: string;
  createdAt: string;
  userId: string;
};

export default function History() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/events?limit=20')
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load events:', e);
        setLoading(false);
      });
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${minutes}m`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDomainColor = (domain: string) => {
    if (domain.includes('github')) return 'text-purple-400';
    if (domain.includes('youtube')) return 'text-red-400';
    if (domain.includes('substack')) return 'text-orange-400';
    return 'text-blue-400';
  };

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
          <Link className="hover:text-amber-400" href="/ideas">Ideas</Link>
          <Link className="text-amber-400" href="/history">History</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Browse History</h1>
          <p className="mt-2 text-neutral-400">
            Attention data collected from your browsing ({total} total events).
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-300">Loading history...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-300">No browsing data collected yet. Make sure the extension is configured and visit allowlisted sites.</p>
            <Link 
              href="/dashboard"
              className="inline-block mt-4 px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              ← Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {event.title || 'Untitled Page'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-sm font-mono ${getDomainColor(event.domain)}`}>
                        {event.domain}
                      </span>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-400">
                        {formatTime(event.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className="text-sm font-semibold text-amber-400">
                      {formatDuration(event.minutes)}
                    </span>
                    {event.scrollPercent !== null && (
                      <span className="text-xs text-neutral-400">
                        {event.scrollPercent}% scroll
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-neutral-400 font-mono truncate">
                  {event.url}
                </div>
                
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                  <span>Session: {formatTime(event.tsStart)} → {formatTime(event.tsEnd)}</span>
                  <span>User: {event.userId}</span>
                </div>
              </div>
            ))}
            
            <div className="mt-8 flex items-center justify-between">
              <Link 
                href="/dashboard"
                className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
              >
                ← Back to Dashboard
              </Link>
              
              {total > 20 && (
                <span className="text-sm text-neutral-400">
                  Showing latest 20 of {total} events
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
