"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertModal } from "@/components/Modal";

export default function Debug() {
  const [eventCount, setEventCount] = useState<string>("");
  const [deviceCount, setDeviceCount] = useState<string>("");
  
  // Modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Helper function for modal
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const checkEvents = async () => {
    try {
      const response = await fetch('/api/debug/events');
      const data = await response.json();
      setEventCount(`Events: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      setEventCount(`Error: ${(e as Error).message}`);
    }
  };

  const checkDevices = async () => {
    try {
      const response = await fetch('/api/debug/devices');
      const data = await response.json();
      setDeviceCount(`Devices: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      setDeviceCount(`Error: ${(e as Error).message}`);
    }
  };

  const testIngest = async () => {
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': 'DEVKEY_TEST_123'
        },
        body: JSON.stringify({
          events: [{
            url: 'https://debug.test',
            title: 'Debug Test Page',
            ms: 15000,
            scrollDepth: 0.5,
            tsStart: Date.now() - 15000,
            tsEnd: Date.now()
          }]
        })
      });
      const data = await response.json();
      showAlert('Ingest Test Result', `Status: ${response.status} - ${JSON.stringify(data)}`, response.ok ? 'success' : 'error');
    } catch (e) {
      showAlert('Ingest Error', (e as Error).message, 'error');
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
          <Link className="text-amber-400" href="/debug">Debug</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Debug</h1>
          <p className="mt-2 text-neutral-400">Debug data collection and API connectivity.</p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="font-medium text-amber-400 mb-3">Database Check</h3>
            <div className="flex gap-3 mb-4">
              <button 
                onClick={checkEvents}
                className="px-4 py-2 rounded-md bg-amber-500 text-neutral-950 font-medium hover:bg-amber-400"
              >
                Check Events
              </button>
              <button 
                onClick={checkDevices}
                className="px-4 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600"
              >
                Check Devices
              </button>
              <button 
                onClick={testIngest}
                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500"
              >
                Test Ingest API
              </button>
            </div>
            {eventCount && (
              <div className="mt-4 p-3 rounded bg-neutral-800 text-xs font-mono whitespace-pre">
                {eventCount}
              </div>
            )}
            {deviceCount && (
              <div className="mt-4 p-3 rounded bg-neutral-800 text-xs font-mono whitespace-pre">
                {deviceCount}
              </div>
            )}
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

      {/* Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
