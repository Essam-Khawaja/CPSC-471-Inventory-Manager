"use client"

import { useState } from "react"
import { Plus, Pencil, ArrowRightLeft } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { cargoItems, cargoTypes, warehouses } from "@/lib/data"

export default function CargoPage() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Cargo Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Track and manage all cargo items</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add Cargo
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-card-foreground">All Cargo Items</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Cargo ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Qty</TableHead>
                  <TableHead className="hidden lg:table-cell">Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargoItems.map((cargo) => (
                  <TableRow key={cargo.id}>
                    <TableCell className="pl-6 font-mono text-xs font-medium">{cargo.id}</TableCell>
                    <TableCell className="font-medium text-card-foreground">{cargo.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{cargo.type}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{cargo.quantity.toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{cargo.warehouse}</TableCell>
                    <TableCell>
                      <StatusBadge status={cargo.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit {cargo.name}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <ArrowRightLeft className="size-3.5" />
                          <span className="sr-only">Move {cargo.name} to container</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Cargo Item</DialogTitle>
              <DialogDescription>Fill in the details to add a new cargo item to the inventory.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cargo-name">Cargo Name</Label>
                <Input id="cargo-name" placeholder="Enter cargo name" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cargo-type">Type</Label>
                <Select>
                  <SelectTrigger id="cargo-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargoTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cargo-qty">Quantity</Label>
                <Input id="cargo-qty" type="number" placeholder="0" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cargo-wh">Warehouse</Label>
                <Select>
                  <SelectTrigger id="cargo-wh" className="w-full">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.name}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cargo-status">Status</Label>
                <Select defaultValue="stored">
                  <SelectTrigger id="cargo-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stored">Stored</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => setAddOpen(false)}>Add Cargo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
