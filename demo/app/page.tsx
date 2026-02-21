"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { KpiCards } from "@/components/kpi-cards"
import { RecentShipments } from "@/components/recent-shipments"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of your freight operations</p>
        </div>
        <KpiCards />
        <RecentShipments />
      </div>
    </DashboardShell>
  )
}
