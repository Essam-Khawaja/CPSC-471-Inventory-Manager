"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type LayoutShellProps = {
  role: "ADMIN" | "STAFF" | "UNKNOWN";
  children: React.ReactNode;
};

// Wraps all authenticated pages with sidebar, topbar, and main content area.
// Manages mobile sidebar open/close state so Topbar hamburger can toggle it.
export function LayoutShell({ role, children }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Dark overlay shown behind sidebar on mobile when open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        role={role}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-50 px-4 py-4 dark:bg-black sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
