"use client"

import { useState } from "react"
import { DesktopSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { currentUser } from "@/lib/data"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar
        role={currentUser.role}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav user={currentUser} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
