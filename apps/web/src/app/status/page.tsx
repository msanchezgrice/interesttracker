"use client";
import Link from "next/link";
import { useState } from "react";

export default function Status() {
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [dbStatus, setDbStatus] = useState<string>("");

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(`✅ API: ${response.status} - ${JSON.stringify(data)}`);
    } catch (e) {
      setHealthStatus(`❌ API Error: ${(e as Error).message}`);
    }
  };

  const checkDatabase = async () => {
    try {
      const response = await fetch('/api/devices/init', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setDbStatus(`✅ Database: Connected - Generated device key`);
      } else {
        setDbStatus(`❌ Database: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (e) {
      setDbStatus(`❌ Database Error: ${(e as Error).message}`);
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
          <Link className="text-amber-400" href="/status">Status</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">API Status</h1>
          <p className="mt-2 text-neutral-400">Check backend health and database connectivity.</p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Health Check</h3>
            <p className="text-neutral-300 text-sm mb-4">Test basic API connectivity.</p>
            <button 
              onClick={checkHealth}
              className="px-4 py-2 rounded-md bg-amber-500 text-neutral-950 font-medium hover:bg-amber-400 mr-4"
            >
              Test Health
            </button>
            {healthStatus && (
              <div className="mt-4 p-3 rounded bg-neutral-800 text-sm font-mono">
                {healthStatus}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Database Check</h3>
            <p className="text-neutral-300 text-sm mb-4">Test database connection and device creation.</p>
            <button 
              onClick={checkDatabase}
              className="px-4 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 mr-4"
            >
              Test Database
            </button>
            {dbStatus && (
              <div className="mt-4 p-3 rounded bg-neutral-800 text-sm font-mono">
                {dbStatus}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">API Endpoints</h3>
            <div className="text-neutral-300 text-sm space-y-2">
              <div><code className="px-1 py-0.5 bg-neutral-800 rounded">GET /api/health</code> - Health check</div>
              <div><code className="px-1 py-0.5 bg-neutral-800 rounded">POST /api/devices/init</code> - Generate device key</div>
              <div><code className="px-1 py-0.5 bg-neutral-800 rounded">POST /api/ingest</code> - Accept extension events</div>
              <div><code className="px-1 py-0.5 bg-neutral-800 rounded">POST /api/ideas/generate</code> - Generate content ideas</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link 
            href="/dashboard"
            className="inline-block px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-600"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
