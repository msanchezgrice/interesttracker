"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Sparkles, Clock, ScrollText, Hash, Lightbulb } from "lucide-react";

type EnhancedEvent = {
  id: string;
  url: string;
  title: string | null;
  domain: string;
  sessionLength: number;
  scrollPercentage: number;
  date: string;
  formattedDate: string;
  themes: string[];
  contentTags: string[];
  interestScore: number;
  potentialIdeas: Array<{
    title: string;
    hook: string;
    format: string;
  }>;
  description?: string;
  metadataFetched: boolean;
};

export default function History() {
  const [events, setEvents] = useState<EnhancedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [analyzingEvents, setAnalyzingEvents] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'tsStart' | 'interestScore'>('tsStart');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchEvents();
  }, [sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events/enhanced?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=100`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEvent = async (eventId: string) => {
    setAnalyzingEvents(prev => new Set(prev).add(eventId));
    
    try {
      const response = await fetch('/api/events/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      if (response.ok) {
        // Refresh events to show updated data
        await fetchEvents();
      }
    } catch (error) {
      console.error('Failed to analyze event:', error);
    } finally {
      setAnalyzingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getInterestColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-neutral-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-neutral-800 rounded mb-8"></div>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-neutral-900 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-neutral-800">
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Browsing History</h1>
            <p className="mt-2 text-neutral-400">Enhanced view of your engaged content with AI analysis.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSortBy(sortBy === 'tsStart' ? 'interestScore' : 'tsStart')}
              className="px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600 text-sm"
            >
              Sort by: {sortBy === 'tsStart' ? 'Date' : 'Interest'}
            </button>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-neutral-300">No browsing history yet. Install the extension and start browsing!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 text-sm text-neutral-400">
                  <th className="text-left py-3 px-4">Website</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-center py-3 px-4">Session</th>
                  <th className="text-center py-3 px-4">Scroll</th>
                  <th className="text-left py-3 px-4">Themes</th>
                  <th className="text-left py-3 px-4">Tags</th>
                  <th className="text-center py-3 px-4">Interest</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr className="border-b border-neutral-800 hover:bg-neutral-900/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleRow(event.id)}
                            className="mt-1 text-neutral-400 hover:text-neutral-200"
                          >
                            {expandedRows.has(event.id) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </button>
                          <div className="flex-1">
                            <a 
                              href={event.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                            >
                              <span className="font-medium truncate max-w-[300px]">
                                {event.title || event.domain}
                              </span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                            <p className="text-xs text-neutral-500 mt-1">{event.domain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-300">
                        {new Date(event.date).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-neutral-500">
                          {new Date(event.date).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-neutral-400" />
                          <span>{formatDuration(event.sessionLength)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <ScrollText className="h-3 w-3 text-neutral-400" />
                          <span>{event.scrollPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {event.themes.length > 0 ? (
                            event.themes.map((theme, i) => (
                              <span key={i} className="px-2 py-1 bg-neutral-800 rounded text-xs">
                                {theme}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {event.contentTags.length > 0 ? (
                            event.contentTags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-neutral-400">
                                <Hash className="h-3 w-3" />
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-500">—</span>
                          )}
                          {event.contentTags.length > 3 && (
                            <span className="text-xs text-neutral-500">+{event.contentTags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-lg font-bold ${getInterestColor(event.interestScore)}`}>
                          {event.interestScore || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {!event.metadataFetched ? (
                          <button
                            onClick={() => analyzeEvent(event.id)}
                            disabled={analyzingEvents.has(event.id)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 rounded text-xs font-medium transition-colors"
                          >
                            {analyzingEvents.has(event.id) ? (
                              <span className="flex items-center gap-1">
                                <span className="animate-spin">⏳</span>
                                Analyzing...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Analyze
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-green-400">✓ Analyzed</span>
                        )}
                      </td>
                    </tr>
                    
                    {expandedRows.has(event.id) && (
                      <tr>
                        <td colSpan={8} className="bg-neutral-900/50 px-4 py-6">
                          <div className="space-y-4">
                            {event.description && (
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-2">Description</h4>
                                <p className="text-sm text-neutral-400">{event.description}</p>
                              </div>
                            )}
                            
                            {event.contentTags.length > 3 && (
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-2">All Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                  {event.contentTags.map((tag, i) => (
                                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded text-xs">
                                      <Hash className="h-3 w-3" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {event.potentialIdeas && event.potentialIdeas.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-amber-400" />
                                  Potential Content Ideas
                                </h4>
                                <div className="space-y-2">
                                  {event.potentialIdeas.map((idea, i) => (
                                    <div key={i} className="p-3 bg-neutral-800 rounded">
                                      <p className="font-medium text-sm">{idea.title}</p>
                                      <p className="text-xs text-neutral-400 mt-1">{idea.hook}</p>
                                      <span className="inline-block mt-2 px-2 py-1 bg-neutral-700 rounded text-xs">
                                        {idea.format}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}