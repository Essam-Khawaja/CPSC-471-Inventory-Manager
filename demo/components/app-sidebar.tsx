"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Container,
  Truck,
  Ship,
  Users,
  ChevronLeft,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import type { UserRole } from "@/lib/data"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Cargo", href: "/cargo", icon: Package },
  { label: "Warehouses", href: "/warehouses", icon: Warehouse },
  { label: "Containers", href: "/containers", icon: Container },
  { label: "Shipments", href: "/shipments", icon: Ship },
  { label: "Carriers", href: "/carriers", icon: Truck },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
]

function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname()

  const filteredItems = navItems.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || role === "admin"
  )

  return (
    <nav className="flex flex-col gap-1 px-3">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DesktopSidebar({ role, collapsed, onToggle }: { role: UserRole; collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()

  const filteredItems = navItems.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || role === "admin"
  )

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className={cn("flex items-center border-b border-sidebar-border h-16 px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Ship className="size-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">Freight Cargo</span>
          </div>
        )}
        {collapsed && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Ship className="size-4 text-sidebar-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("size-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "hidden")}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Collapse sidebar</span>
        </Button>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[11px] text-sidebar-foreground/40 font-medium">Freight Cargo Manager v1.0</p>
        </div>
      )}
    </aside>
  )
}

export function MobileSidebar({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 h-16">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Ship className="size-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Freight Cargo</span>
        </div>
        <div className="py-4">
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
