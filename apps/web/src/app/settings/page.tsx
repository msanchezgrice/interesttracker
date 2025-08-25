"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Plus, X, Sun, Moon } from "lucide-react";

export default function Settings() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [deviceKeys, setDeviceKeys] = useState<string[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [deniedDomains, setDeniedDomains] = useState<string[]>([]);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Load interests from localStorage
    const savedInterests = localStorage.getItem('weeklyInterests');
    if (savedInterests) {
      setInterests(JSON.parse(savedInterests));
    }

    // Load other settings
    const savedAllowedDomains = localStorage.getItem('allowedDomains');
    if (savedAllowedDomains) {
      setAllowedDomains(JSON.parse(savedAllowedDomains));
    }

    const savedDeniedDomains = localStorage.getItem('deniedDomains');
    if (savedDeniedDomains) {
      setDeniedDomains(JSON.parse(savedDeniedDomains));
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const updated = [...interests, newInterest.trim()];
      setInterests(updated);
      localStorage.setItem('weeklyInterests', JSON.stringify(updated));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    const updated = interests.filter(i => i !== interest);
    setInterests(updated);
    localStorage.setItem('weeklyInterests', JSON.stringify(updated));
  };

  const clearAllInterests = () => {
    setInterests([]);
    localStorage.removeItem('weeklyInterests');
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
        {/* Things I am interested in this week - moved to top */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 text-lg">
                Things I am interested in this week
              </h3>
              <p className="text-neutral-400 dark:text-neutral-400 light:text-neutral-600 text-sm mt-1">
                Add topics you want to focus on. These will influence your content recommendations.
              </p>
            </div>
            <button
              onClick={clearAllInterests}
              className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                placeholder="Add an interest (e.g., AI agents, Web3, productivity)"
                className="flex-1 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={addInterest}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 rounded-full text-sm"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
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

        {/* Extension Settings */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-4">
            Extension Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mb-2">
                Device Keys
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 light:text-neutral-600">
                Manage device keys for your browser extensions. Generate new keys from the Dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Domain Settings */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-4">
            Domain Filtering
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Allowed Domains</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 light:text-neutral-600 mb-3">
                Only track activity on these domains (leave empty to track all)
              </p>
              <textarea
                placeholder="example.com&#10;another-site.com"
                className="w-full h-24 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm font-mono focus:outline-none focus:border-amber-500"
                value={allowedDomains.join('\n')}
                onChange={(e) => {
                  const domains = e.target.value.split('\n').filter(d => d.trim());
                  setAllowedDomains(domains);
                  localStorage.setItem('allowedDomains', JSON.stringify(domains));
                }}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Denied Domains</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 light:text-neutral-600 mb-3">
                Never track activity on these domains
              </p>
              <textarea
                placeholder="social-media.com&#10;distracting-site.com"
                className="w-full h-24 px-3 py-2 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-50 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 rounded-md text-sm font-mono focus:outline-none focus:border-amber-500"
                value={deniedDomains.join('\n')}
                onChange={(e) => {
                  const domains = e.target.value.split('\n').filter(d => d.trim());
                  setDeniedDomains(domains);
                  localStorage.setItem('deniedDomains', JSON.stringify(domains));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
