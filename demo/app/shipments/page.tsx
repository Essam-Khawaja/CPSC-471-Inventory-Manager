"use client"

import { useState } from "react"
import { Plus, Eye, RefreshCw } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { shipments, warehouses, carriers } from "@/lib/data"

export default function ShipmentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [filterWarehouse, setFilterWarehouse] = useState("all")

  const filtered =
    filterWarehouse === "all"
      ? shipments
      : shipments.filter((s) => s.origin === filterWarehouse)

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Shipment Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Create and track shipments across warehouses</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Create Shipment
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
            <CardTitle className="text-base font-semibold text-card-foreground">All Shipments</CardTitle>
            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filter by Origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Origins</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.name}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Shipment ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Origin</TableHead>
                  <TableHead className="hidden md:table-cell">Destination</TableHead>
                  <TableHead className="hidden lg:table-cell">Carrier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Departure</TableHead>
                  <TableHead className="hidden xl:table-cell">Arrival</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="pl-6 font-mono text-xs font-medium">{shipment.id}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{shipment.origin}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{shipment.destination}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{shipment.carrier}</TableCell>
                    <TableCell>
                      <StatusBadge status={shipment.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{shipment.departureDate}</TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">{shipment.arrivalDate || "---"}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <Eye className="size-3.5" />
                          <span className="sr-only">View shipment {shipment.id}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <RefreshCw className="size-3.5" />
                          <span className="sr-only">Update status of {shipment.id}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Shipment</DialogTitle>
              <DialogDescription>Set up a new shipment between warehouses.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="origin-wh">Origin Warehouse</Label>
                <Select>
                  <SelectTrigger id="origin-wh" className="w-full">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.name}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dest-wh">Destination Warehouse</Label>
                <Select>
                  <SelectTrigger id="dest-wh" className="w-full">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.name}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select>
                  <SelectTrigger id="carrier" className="w-full">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="departure-date">Departure Date</Label>
                <Input id="departure-date" type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => setCreateOpen(false)}>Create Shipment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
