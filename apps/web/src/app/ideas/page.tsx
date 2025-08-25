"use client";
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");

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

  const generateIdeas = async () => {
    setGeneratingIdeas(true);
    setGenerationStatus("");
    
    try {
      // Get ignored domains from localStorage
      const ignoredDomains = JSON.parse(localStorage.getItem('ignoredDomains') || '[]');
      
      // Get user preferences from API
      const prefResponse = await fetch('/api/preferences');
      const preferences = await prefResponse.json();
      
      const response = await fetch('/api/ideas/generate', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ignoredDomains, 
          weeklyThemes: preferences.weeklyThemes || [],
          generalInterests: preferences.generalInterests || [],
          userExpertise: preferences.extractedExpertise || []
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setGenerationStatus(`✓ Generated ${data.ideas?.length || 0} ideas from ${data.eventsProcessed || 0} events`);
        // Refresh the ideas list
        const ideasResponse = await fetch('/api/ideas');
        const ideasData = await ideasResponse.json();
        setIdeas(ideasData.ideas || []);
      } else {
        setGenerationStatus(`✗ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      setGenerationStatus('✗ Failed to generate ideas');
    } finally {
      setGeneratingIdeas(false);
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
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Ideas & Drafts</h1>
            <p className="mt-2 text-neutral-400 dark:text-neutral-400 light:text-neutral-600">Generated content ideas based on your attention data.</p>
          </div>
          <button
            onClick={generateIdeas}
            disabled={generatingIdeas}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-700 dark:disabled:bg-neutral-700 light:disabled:bg-neutral-300 text-neutral-950 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
          >
              {generatingIdeas ? 'Generating...' : 'Generate New Ideas'}
            </button>
          </div>
          {generationStatus && (
            <p className={`mt-4 text-sm ${generationStatus.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {generationStatus}
            </p>
          )}
        </div>

                {loading ? (
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <p className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700">Loading ideas...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <p className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700">No ideas generated yet. Collect some attention data and generate ideas from the dashboard.</p>
          <Link 
            href="/dashboard"
            className="inline-block mt-4 px-4 py-2 rounded-md border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 hover:border-neutral-600 dark:hover:border-neutral-600 light:hover:border-neutral-400"
          >
              ← Back to Dashboard
            </Link>
          </div>
        ) : (
        <div className="space-y-6">
          {ideas.map((idea) => (
            <div key={idea.id} className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 text-lg">{idea.topic}</h3>
                    <span className="text-2xl">{getPlatformEmoji(idea.format)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
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
                <p className="text-sm text-neutral-500 dark:text-neutral-500 light:text-neutral-600 mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {idea.sourceUrls.slice(0, 3).map((url, i) => (
                      <a 
                        key={i}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 hover:text-amber-400 dark:hover:text-amber-400 light:hover:text-amber-600"
                      >
                        {new URL(url).hostname}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                    {idea.sourceUrls.length > 3 && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 light:text-neutral-600">
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
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-200 rounded text-xs">
                          <Hash className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Draft Content */}
                {idea.proposedOutput && (
                <div className="mb-4 p-4 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
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
                        <Copy className="h-4 w-4 text-neutral-400 dark:text-neutral-400 light:text-neutral-600" />
                        )}
                      </button>
                    </div>
                  <pre className="whitespace-pre-wrap text-sm text-neutral-200 dark:text-neutral-200 light:text-neutral-900 font-normal">
                      {idea.proposedOutput.content}
                    </pre>
                    {idea.proposedOutput.metadata?.hashtags && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {idea.proposedOutput.metadata.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-amber-400 dark:text-amber-400 light:text-amber-600">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reach Reasoning */}
                {idea.estimatedReach?.reasoning && (
                <p className="text-xs text-neutral-500 dark:text-neutral-500 light:text-neutral-600 italic mb-4">
                    {idea.estimatedReach.reasoning}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {idea.status === 'PENDING' && (
                    <>
                    <button
                      onClick={() => updateStatus(idea.id, 'accept')}
                      className="px-3 py-1 bg-green-600 dark:bg-green-600 light:bg-green-500 hover:bg-green-500 dark:hover:bg-green-500 light:hover:bg-green-400 rounded text-sm font-medium text-white"
                    >
                        Accept
                      </button>
                    <button
                      onClick={() => updateStatus(idea.id, 'reject')}
                      className="px-3 py-1 bg-red-600 dark:bg-red-600 light:bg-red-500 hover:bg-red-500 dark:hover:bg-red-500 light:hover:bg-red-400 rounded text-sm font-medium text-white"
                    >
                        Reject
                      </button>
                    </>
                  )}
                  {idea.status === 'ACCEPTED' && (
                  <button
                    onClick={() => updateStatus(idea.id, 'posted')}
                    className="px-3 py-1 bg-blue-600 dark:bg-blue-600 light:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-500 light:hover:bg-blue-400 rounded text-sm font-medium text-white"
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
              className="inline-block px-4 py-2 rounded-md border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 hover:border-neutral-600 dark:hover:border-neutral-600 light:hover:border-neutral-400"
            >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
      )}
    </DashboardLayout>
  );
}