"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md border border-neutral-700 dark:border-neutral-700 hover:border-neutral-600 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
      ) : (
        <Moon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
      )}
    </button>
  );
}
