import { Package, Ship, Container, Warehouse } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { shipments, cargoItems, containers, warehouses } from "@/lib/data"

const kpis = [
  {
    label: "Total Cargo Items",
    value: cargoItems.length,
    icon: Package,
    change: "+12%",
    trend: "up" as const,
  },
  {
    label: "Active Shipments",
    value: shipments.filter((s) => s.status !== "delivered").length,
    icon: Ship,
    change: "+3%",
    trend: "up" as const,
  },
  {
    label: "Containers In Transit",
    value: containers.filter((c) => c.status === "in_transit").length,
    icon: Container,
    change: "-5%",
    trend: "down" as const,
  },
  {
    label: "Warehouses",
    value: warehouses.length,
    icon: Warehouse,
    change: "0%",
    trend: "neutral" as const,
  },
]

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-card-foreground tracking-tight">{kpi.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="size-5 text-primary" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <span
                className={
                  kpi.trend === "up"
                    ? "text-success font-medium"
                    : kpi.trend === "down"
                    ? "text-destructive font-medium"
                    : "text-muted-foreground font-medium"
                }
              >
                {kpi.change}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
