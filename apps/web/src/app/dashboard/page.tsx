"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const router = useRouter();

  const generateIdeas = async () => {
    setGeneratingIdeas(true);
    setGenerationStatus("");
    
    try {
      const response = await fetch('/api/ideas/generate', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setGenerationStatus(`✓ Generated ${data.ideas?.length || 0} ideas from ${data.eventsProcessed || 0} events`);
        // Redirect to ideas page after a short delay
        setTimeout(() => {
          router.push('/ideas');
        }, 1500);
      } else {
        setGenerationStatus(`✗ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setGenerationStatus('✗ Failed to generate ideas');
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const generateDeviceKey = async () => {
    try {
      const response = await fetch('/api/devices/init', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        await navigator.clipboard.writeText(data.deviceKey);
        alert(`Device key copied to clipboard: ${data.deviceKey}`);
      } else {
        alert(`Error: ${data.error || 'Failed to generate key'}`);
      }
    } catch (error) {
      alert('Error generating device key');
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
          <Link className="hover:text-amber-400" href="/ideas">Ideas</Link>
          <Link className="hover:text-amber-400" href="/history">History</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-neutral-400">Manage your attention tracking and content generation.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Get Device Key</h3>
            <p className="text-neutral-300 text-sm mb-4">
              Generate a device key for your Chrome extension.
            </p>
            <button 
              onClick={generateDeviceKey}
              className="px-4 py-2 rounded-md bg-amber-500 text-neutral-950 font-medium hover:bg-amber-400"
            >
              Generate & Copy Key
            </button>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Extension Setup</h3>
            <div className="text-neutral-300 text-sm space-y-2">
              <p>1. Download and install the extension</p>
              <p>2. Open side panel, paste device key</p>
              <p>3. Set ingest URL: <code className="px-1 py-0.5 bg-neutral-800 rounded text-xs">https://interesttracker.vercel.app/api/ingest</code></p>
              <p>4. Configure allowlist and unpause</p>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Manual Trends</h3>
            <p className="text-neutral-300 text-sm mb-4">
              Add trending topics to influence content rankings.
            </p>
            <Link 
              href="/trends"
              className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              Manage Trends
            </Link>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Ideas & Drafts</h3>
            <p className="text-neutral-300 text-sm mb-4">
              View generated content ideas and drafts.
            </p>
            <Link 
              href="/ideas"
              className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              View Ideas
            </Link>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Generate Ideas</h3>
            <p className="text-neutral-300 text-sm mb-4">
              Process your recent attention data into content ideas.
            </p>
            <button 
              onClick={generateIdeas}
              disabled={generatingIdeas}
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-700 text-neutral-950 font-medium disabled:cursor-not-allowed transition-colors"
            >
              {generatingIdeas ? 'Generating...' : 'Generate Now'}
            </button>
            {generationStatus && (
              <p className={`mt-3 text-xs ${generationStatus.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
                {generationStatus}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Browse History</h3>
            <p className="text-neutral-300 text-sm mb-4">
              View collected attention data and debug tracking.
            </p>
            <Link 
              href="/history"
              className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              View History
            </Link>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">API Status</h3>
            <p className="text-neutral-300 text-sm mb-4">
              Check backend health and database connectivity.
            </p>
            <Link 
              href="/status"
              className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
            >
              View Status
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}