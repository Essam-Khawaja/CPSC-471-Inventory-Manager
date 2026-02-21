"use client"

import { MapPin, Package, Eye } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { warehouses } from "@/lib/data"

export default function WarehousesPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Warehouses</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage warehouse locations and inventory</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((wh) => (
            <Card key={wh.id} className="border-border bg-card group hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-card-foreground">{wh.name}</h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="size-3.5" />
                        <span className="text-xs">{wh.location}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{wh.id}</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                    <Package className="size-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-card-foreground">{wh.totalCargo}</span>
                      <span className="text-[11px] text-muted-foreground">Total Stored Cargo</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Eye className="size-3.5" />
                    View Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
