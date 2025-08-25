"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Plus, X, Sun, Moon, Copy, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [weeklyThemes, setWeeklyThemes] = useState<string[]>([]);
  const [newWeeklyTheme, setNewWeeklyTheme] = useState("");
  const [generalInterests, setGeneralInterests] = useState<string[]>([]);
  const [newGeneralInterest, setNewGeneralInterest] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [manualExpertise, setManualExpertise] = useState("");
  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);
  const [deviceKey, setDeviceKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{
    database: boolean;
    api: boolean;
    message: string;
  }>({ database: false, api: false, message: "Checking..." });

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Load from API and localStorage
    checkStatus();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      const data = await response.json();
      if (response.ok) {
        setWeeklyThemes(data.weeklyThemes || []);
        setGeneralInterests(data.generalInterests || []);
        setLinkedinUrl(data.linkedinUrl || '');
        setExpertise(data.extractedExpertise || []);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
    } catch {
      setStatus({
        database: false,
        api: false,
        message: "Failed to check status"
      });
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
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Theme application is handled by DashboardLayout
    // Force page reload to apply theme changes
    window.location.reload();
  };

  const addWeeklyTheme = async () => {
    if (newWeeklyTheme.trim() && !weeklyThemes.includes(newWeeklyTheme.trim())) {
      const updated = [...weeklyThemes, newWeeklyTheme.trim()];
      setWeeklyThemes(updated);
      setNewWeeklyTheme("");
      await savePreferences({ weeklyThemes: updated, generalInterests });
    }
  };

  const removeWeeklyTheme = async (theme: string) => {
    const updated = weeklyThemes.filter(t => t !== theme);
    setWeeklyThemes(updated);
    await savePreferences({ weeklyThemes: updated, generalInterests });
  };

  const clearWeeklyThemes = async () => {
    setWeeklyThemes([]);
    await savePreferences({ weeklyThemes: [], generalInterests });
  };

  const addGeneralInterest = async () => {
    if (newGeneralInterest.trim() && !generalInterests.includes(newGeneralInterest.trim())) {
      const updated = [...generalInterests, newGeneralInterest.trim()];
      setGeneralInterests(updated);
      setNewGeneralInterest("");
      await savePreferences({ weeklyThemes, generalInterests: updated });
    }
  };

  const removeGeneralInterest = async (interest: string) => {
    const updated = generalInterests.filter(i => i !== interest);
    setGeneralInterests(updated);
    await savePreferences({ weeklyThemes, generalInterests: updated });
  };

  const clearGeneralInterests = async () => {
    setGeneralInterests([]);
    await savePreferences({ weeklyThemes, generalInterests: [] });
  };

  const savePreferences = async (data: { 
    weeklyThemes: string[]; 
    generalInterests: string[]; 
    linkedinUrl?: string;
    extractedExpertise?: string[];
  }) => {
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      // Also save to localStorage for backwards compatibility
      localStorage.setItem('weeklyInterests', JSON.stringify(data.weeklyThemes));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };



  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
          Configure your MakerPulse preferences and tracking settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Themes for this week - at top */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 text-lg">
                Themes for this week
              </h3>
              <p className="text-neutral-400 dark:text-neutral-400 light:text-neutral-600 text-sm mt-1">
                Add specific themes you want to focus on this week. These strongly influence your content ideas.
              </p>
            </div>
            <button
              onClick={clearWeeklyThemes}
              className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newWeeklyTheme}
                onChange={(e) => setNewWeeklyTheme(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWeeklyTheme()}
                placeholder="Add a weekly theme (e.g., AI agents, Web3, productivity)"
                className="flex-1 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={addWeeklyTheme}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {weeklyThemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {weeklyThemes.map((theme) => (
                  <span
                    key={theme}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 rounded-full text-sm"
                  >
                    {theme}
                    <button
                      onClick={() => removeWeeklyTheme(theme)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* General interests - second from top */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 text-lg">
                General interests
              </h3>
              <p className="text-neutral-400 dark:text-neutral-400 light:text-neutral-600 text-sm mt-1">
                Add your ongoing interests. These provide background context for content recommendations.
              </p>
            </div>
            <button
              onClick={clearGeneralInterests}
              className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGeneralInterest}
                onChange={(e) => setNewGeneralInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGeneralInterest()}
                placeholder="Add a general interest (e.g., startups, design, marketing)"
                className="flex-1 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={addGeneralInterest}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {generalInterests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {generalInterests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 rounded-full text-sm"
                  >
                    {interest}
                    <button
                      onClick={() => removeGeneralInterest(interest)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Professional Expertise */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <div className="mb-4">
            <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 text-lg">
              Professional Expertise
            </h3>
            <p className="text-neutral-400 dark:text-neutral-400 light:text-neutral-600 text-sm mt-1">
              Connect your LinkedIn or manually add your expertise to personalize content ideas.
            </p>
          </div>

          <div className="space-y-4">
            {/* LinkedIn URL input */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 dark:text-neutral-300 light:text-neutral-700 mb-2">
                LinkedIn Profile URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="flex-1 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={async () => {
                    setSyncingLinkedIn(true);
                    try {
                      const response = await fetch('/api/linkedin/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ linkedinUrl })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setExpertise(data.expertise || []);
                        await savePreferences({ 
                          weeklyThemes, 
                          generalInterests, 
                          linkedinUrl,
                          extractedExpertise: data.expertise 
                        });
                        if (data.message) {
                          alert(data.message);
                        }
                      } else {
                        alert(data.error || 'Failed to sync LinkedIn');
                      }
                    } catch (error) {
                      console.error('Failed to sync LinkedIn:', error);
                    } finally {
                      setSyncingLinkedIn(false);
                    }
                  }}
                  disabled={!linkedinUrl || syncingLinkedIn}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-700 disabled:cursor-not-allowed text-neutral-950 rounded-md text-sm font-medium transition-colors"
                >
                  {syncingLinkedIn ? 'Syncing...' : 'Sync LinkedIn'}
                </button>
              </div>
            </div>

            {/* Manual expertise input */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 dark:text-neutral-300 light:text-neutral-700 mb-2">
                Add Expertise Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualExpertise}
                  onChange={(e) => setManualExpertise(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualExpertise.trim()) {
                      const updated = [...expertise, manualExpertise.trim()];
                      setExpertise(updated);
                      setManualExpertise("");
                      savePreferences({ 
                        weeklyThemes, 
                        generalInterests, 
                        linkedinUrl,
                        extractedExpertise: updated 
                      });
                    }
                  }}
                  placeholder="e.g., React, Product Management, AI/ML"
                  className="flex-1 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={async () => {
                    if (manualExpertise.trim()) {
                      const updated = [...expertise, manualExpertise.trim()];
                      setExpertise(updated);
                      setManualExpertise("");
                      await savePreferences({ 
                        weeklyThemes, 
                        generalInterests, 
                        linkedinUrl,
                        extractedExpertise: updated 
                      });
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Display expertise */}
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={async () => {
                        const updated = expertise.filter(s => s !== skill);
                        setExpertise(updated);
                        await savePreferences({ 
                          weeklyThemes, 
                          generalInterests, 
                          linkedinUrl,
                          extractedExpertise: updated 
                        });
                      }}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-4">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
                Choose between light and dark mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 hover:bg-neutral-700 dark:hover:bg-neutral-700 light:hover:bg-neutral-200 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Database Connection</span>
              {status.database ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>API Health</span>
              {status.api ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 light:text-neutral-600">
              {status.message}
            </p>
          </div>
        </div>

        {/* Device Key Generation */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-4">
            Extension Setup
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Device Key</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 light:text-neutral-600 mb-3">
                Generate a unique key for your browser extension
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceKey}
                  readOnly
                  placeholder="Click generate to create a device key"
                  className="flex-1 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm font-mono"
                />
                <button
                  onClick={generateDeviceKey}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md text-sm font-medium transition-colors"
                >
                  Generate
                </button>
                {deviceKey && (
                  <button
                    onClick={() => copyToClipboard(deviceKey)}
                    className="px-4 py-2 bg-neutral-700 dark:bg-neutral-700 light:bg-neutral-200 hover:bg-neutral-600 dark:hover:bg-neutral-600 light:hover:bg-neutral-300 rounded-md text-sm transition-colors"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
}