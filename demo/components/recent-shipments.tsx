"use client"

import Link from "next/link"
import { Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { shipments } from "@/lib/data"

export function RecentShipments() {
  const recent = shipments.slice(0, 5)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold text-card-foreground">Recent Shipments</CardTitle>
        <Link href="/shipments">
          <Button variant="outline" size="sm" className="text-xs">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Shipment ID</TableHead>
              <TableHead className="hidden sm:table-cell">Origin</TableHead>
              <TableHead className="hidden md:table-cell">Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Departure</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell className="pl-6 font-mono text-xs font-medium">{shipment.id}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{shipment.origin}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{shipment.destination}</TableCell>
                <TableCell>
                  <StatusBadge status={shipment.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{shipment.departureDate}</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                    <Eye className="size-4" />
                    <span className="sr-only">View shipment {shipment.id}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
