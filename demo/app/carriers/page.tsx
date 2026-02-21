"use client"

import { Ship } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { carriers, shipments } from "@/lib/data"

export default function CarriersPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Carriers</h2>
          <p className="text-sm text-muted-foreground mt-1">Shipping carrier partners and their active shipments</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {carriers.map((carrier) => {
            const carrierShipments = shipments.filter((s) => s.carrier === carrier)
            const activeCount = carrierShipments.filter((s) => s.status !== "delivered").length

            return (
              <Card key={carrier} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Ship className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <h3 className="text-sm font-semibold text-card-foreground">{carrier}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-card-foreground">{carrierShipments.length}</span>
                          <span className="text-[11px] text-muted-foreground">Total Shipments</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-primary">{activeCount}</span>
                          <span className="text-[11px] text-muted-foreground">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
