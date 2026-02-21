"use client"

import { useState } from "react"
import { Link2 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { containers, shipments } from "@/lib/data"

export default function ContainersPage() {
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)

  const activeShipments = shipments.filter((s) => s.status !== "delivered")

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Container Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Track containers and assign them to shipments</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-card-foreground">All Containers</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Container ID</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="hidden sm:table-cell">Current Location</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned Shipment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell className="pl-6 font-mono text-xs font-medium">{container.id}</TableCell>
                    <TableCell className="text-muted-foreground">{container.capacity}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{container.currentLocation}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {container.assignedShipment ? (
                        <span className="font-mono text-xs font-medium text-primary">{container.assignedShipment}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={container.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        disabled={container.status !== "available"}
                        onClick={() => {
                          setSelectedContainer(container.id)
                          setAssignOpen(true)
                        }}
                      >
                        <Link2 className="size-3.5" />
                        <span className="hidden sm:inline ml-1">Assign</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign to Shipment</DialogTitle>
              <DialogDescription>
                Assign container {selectedContainer} to an active shipment.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>Container</Label>
                <p className="text-sm font-mono font-medium text-foreground">{selectedContainer}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="assign-shipment">Shipment</Label>
                <Select>
                  <SelectTrigger id="assign-shipment" className="w-full">
                    <SelectValue placeholder="Select shipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeShipments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.id} - {s.origin} to {s.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={() => setAssignOpen(false)}>Assign Container</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
