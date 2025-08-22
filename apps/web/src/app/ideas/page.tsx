"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Copy, ExternalLink, TrendingUp, Hash } from "lucide-react";

type Idea = {
  id: string;
  topic: string;
  sourceUrls: string[];
  score: number;
  scoreBreakdown: object;
  status: string;
  createdAt: string;
  tags?: string[];
  format?: string;
  estimatedReach?: {
    score: number;
    reasoning: string;
  };
  proposedOutput?: {
    platform: string;
    content: string;
    metadata?: {
      hashtags?: string[];
      cta?: string;
    };
  };
};

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyToClipboard = async (text: string, ideaId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(ideaId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/ideas/${id}/${status}`, { method: 'POST' });
      // Refresh ideas
      const response = await fetch('/api/ideas');
      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-400';
      case 'REJECTED': return 'text-red-400';
      case 'POSTED': return 'text-blue-400';
      default: return 'text-neutral-400';
    }
  };

  const getPlatformEmoji = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'twitter':
      case 'tweet': return '🐦';
      case 'thread': return '🧵';
      case 'linkedin': return '💼';
      case 'blog': return '📝';
      case 'video': return '🎥';
      default: return '💡';
    }
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
          <Link className="text-amber-400" href="/ideas">Ideas</Link>
          <Link className="hover:text-amber-400" href="/history">History</Link>
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
          <div className="space-y-6">
            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-amber-400 text-lg">{idea.topic}</h3>
                      <span className="text-2xl">{getPlatformEmoji(idea.format)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      <span className={`font-medium ${getStatusColor(idea.status)}`}>
                        {idea.status}
                      </span>
                      <span>Score: {(idea.score * 100).toFixed(0)}/100</span>
                      {idea.estimatedReach && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Reach: {idea.estimatedReach.score}/100
                        </span>
                      )}
                      <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Sources */}
                <div className="mb-4">
                  <p className="text-sm text-neutral-500 mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {idea.sourceUrls.slice(0, 3).map((url, i) => (
                      <a 
                        key={i}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-amber-400"
                      >
                        {new URL(url).hostname}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                    {idea.sourceUrls.length > 3 && (
                      <span className="text-xs text-neutral-500">
                        +{idea.sourceUrls.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded text-xs">
                          <Hash className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Draft Content */}
                {idea.proposedOutput && (
                  <div className="mb-4 p-4 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-neutral-300">
                        {idea.proposedOutput.platform || idea.format || 'Draft'} Content
                      </span>
                      <button
                        onClick={() => copyToClipboard(idea.proposedOutput!.content, idea.id)}
                        className="p-2 rounded hover:bg-neutral-700 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === idea.id ? (
                          <span className="text-xs text-green-400">Copied!</span>
                        ) : (
                          <Copy className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-normal">
                      {idea.proposedOutput.content}
                    </pre>
                    {idea.proposedOutput.metadata?.hashtags && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {idea.proposedOutput.metadata.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-amber-400">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reach Reasoning */}
                {idea.estimatedReach?.reasoning && (
                  <p className="text-xs text-neutral-500 italic mb-4">
                    {idea.estimatedReach.reasoning}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {idea.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(idea.id, 'accept')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(idea.id, 'reject')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {idea.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateStatus(idea.id, 'posted')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
                    >
                      Mark as Posted
                    </button>
                  )}
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