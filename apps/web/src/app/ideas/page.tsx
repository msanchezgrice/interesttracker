"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

type Idea = {
  id: string;
  topic: string;
  sourceUrls: string[];
  score: number;
  scoreBreakdown: object;
  status: string;
  createdAt: string;
};

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ideas')
      .then(r => r.json())
      .then(data => {
        setIdeas(data.ideas || []);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load ideas:', e);
        setLoading(false);
      });
  }, []);

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

        {loading ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-300">Loading ideas...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-300">No ideas generated yet. Collect some attention data and generate ideas from the dashboard.</p>
            <Link 
              href="/dashboard"
              className="inline-block mt-4 px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              ← Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-amber-400">{idea.topic}</h3>
                  <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-1 rounded">
                    Score: {idea.score.toFixed(2)}
                  </span>
                </div>
                <div className="text-neutral-300 text-sm space-y-2">
                  <div>
                    <strong>Sources:</strong> {idea.sourceUrls.slice(0, 3).map(url => new URL(url).hostname).join(', ')}
                    {idea.sourceUrls.length > 3 && ` +${idea.sourceUrls.length - 3} more`}
                  </div>
                  <div>
                    <strong>Status:</strong> {idea.status}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(idea.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-8">
              <Link 
                href="/dashboard"
                className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
