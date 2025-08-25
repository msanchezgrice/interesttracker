"use client";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-neutral-400 dark:text-neutral-400 light:text-neutral-600">Manage your attention tracking and content generation.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-3">Ideas & Drafts</h3>
          <p className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 text-sm mb-4">
              View generated content ideas and drafts.
            </p>
          <Link 
            href="/ideas"
            className="inline-block px-4 py-2 rounded-md border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 hover:border-neutral-600 dark:hover:border-neutral-600 light:hover:border-neutral-400"
          >
              View Ideas
            </Link>
          </div>



        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-neutral-900 dark:bg-neutral-900 light:bg-white p-6">
          <h3 className="font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 mb-3">Browse History</h3>
          <p className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 text-sm mb-4">
              View collected attention data and debug tracking.
            </p>
          <Link 
            href="/history"
            className="inline-block px-4 py-2 rounded-md border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 hover:border-neutral-600 dark:hover:border-neutral-600 light:hover:border-neutral-400"
          >
              View History
            </Link>
          </div>

      </div>
    </DashboardLayout>
  );
}