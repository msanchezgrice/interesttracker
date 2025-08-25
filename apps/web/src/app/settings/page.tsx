"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Settings, Copy, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const [deviceKey, setDeviceKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [focusThemes, setFocusThemes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [status, setStatus] = useState<{
    database: boolean;
    api: boolean;
    message: string;
  }>({ database: false, api: false, message: "Checking..." });

  useEffect(() => {
    checkStatus();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      const data = await response.json();
      if (response.ok) {
        setFocusThemes(data.focusThemes || []);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const generateDeviceKey = async () => {
    try {
      const response = await fetch('/api/devices/init', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setDeviceKey(data.deviceKey);
        copyToClipboard(data.deviceKey);
      } else {
        alert(`Error: ${data.error || 'Failed to generate key'}`);
      }
    } catch {
      alert('Error generating device key');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy to clipboard');
    }
  };

  const addFocusTheme = async () => {
    if (!newTheme.trim()) return;
    
    const updatedThemes = [...focusThemes, newTheme.trim()];
    setFocusThemes(updatedThemes);
    setNewTheme("");
    
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusThemes: updatedThemes })
      });
    } catch (error) {
      console.error('Failed to save focus theme:', error);
    }
  };

  const removeFocusTheme = async (index: number) => {
    const updatedThemes = focusThemes.filter((_, i) => i !== index);
    setFocusThemes(updatedThemes);
    
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusThemes: updatedThemes })
      });
    } catch (error) {
      console.error('Failed to save focus themes:', error);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      setStatus({
        database: data.database,
        api: response.ok,
        message: data.message || 'Connected'
      });
    } catch {
      setStatus({
        database: false,
        api: false,
        message: 'Failed to connect'
      });
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
          <Link className="hover:text-amber-400" href="/history">History</Link>
          <Link className="hover:text-amber-400" href="/ideas">Ideas</Link>
          <Link className="text-amber-400" href="/settings">Settings</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-neutral-400">Configure your MakerPulse extension and check system status.</p>
        </div>

        <div className="space-y-8">
          {/* Device Key */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-400" />
              Device Key
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              Generate a unique key to connect your Chrome extension to your account.
            </p>
            
            {deviceKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deviceKey}
                    readOnly
                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(deviceKey)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={generateDeviceKey}
                  className="text-sm text-neutral-400 hover:text-amber-400"
                >
                  Generate new key
                </button>
              </div>
            ) : (
              <button
                onClick={generateDeviceKey}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md font-medium transition-colors"
              >
                Generate Device Key
              </button>
            )}
          </section>

          {/* Extension Setup */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Extension Setup Guide</h2>
            <ol className="space-y-3 text-sm text-neutral-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Install the MakerPulse Chrome extension</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>Click the extension icon to open the side panel</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>Paste your device key and click Save</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <div>
                  <span>Set the API endpoint to:</span>
                  <code className="block mt-1 px-2 py-1 bg-neutral-800 rounded text-xs font-mono">
                    https://interesttracker.vercel.app/api/ingest
                  </code>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                <span>Start browsing! Your engagement data will be tracked automatically</span>
              </li>
            </ol>
          </section>

          {/* Focus Themes */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Things I&apos;m Focused On This Week</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Add topics you&apos;re currently focused on to help improve content recommendations and idea generation.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFocusTheme()}
                  placeholder="e.g., AI automation, React performance, content marketing..."
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm"
                />
                <button
                  onClick={addFocusTheme}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              
              {focusThemes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {focusThemes.map((theme, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm text-amber-400"
                    >
                      {theme}
                      <button
                        onClick={() => removeFocusTheme(index)}
                        className="text-amber-400/60 hover:text-amber-400 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {focusThemes.length === 0 && (
                <p className="text-xs text-neutral-500 italic">
                  No focus themes added yet. Add some topics to improve your content recommendations!
                </p>
              )}
            </div>
          </section>

          {/* API Status */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">System Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">API Connection</span>
                <div className="flex items-center gap-2">
                  {status.api ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Database</span>
                <div className="flex items-center gap-2">
                  {status.database ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="pt-2 border-t border-neutral-800">
                <p className="text-xs text-neutral-500">Status: {status.message}</p>
              </div>
            </div>
            
            <button
              onClick={checkStatus}
              className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md text-sm transition-colors"
            >
              Refresh Status
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
