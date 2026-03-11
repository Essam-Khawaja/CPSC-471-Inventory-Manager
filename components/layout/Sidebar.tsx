"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Warehouse,
  ClipboardList,
  Ship,
  Boxes,
  PackageSearch,
  Truck,
  Route as RouteIcon,
  MapPin,
  BarChart3,
  Users,
} from "lucide-react";

type Role = "ADMIN" | "STAFF" | "UNKNOWN";

type SidebarProps = {
  role: Role;
};

const allSections = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
      { href: "/warehouses", label: "Warehouses", icon: Warehouse, roles: ["ADMIN"] },
      { href: "/inventory", label: "Inventory", icon: ClipboardList, roles: ["ADMIN", "STAFF"] },
      { href: "/shipments", label: "Shipments", icon: Ship, roles: ["ADMIN", "STAFF"] },
      { href: "/containers", label: "Containers", icon: Boxes, roles: ["ADMIN", "STAFF"] },
      { href: "/cargo", label: "Cargo Items", icon: PackageSearch, roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/carriers", label: "Carriers", icon: Truck, roles: ["ADMIN"] },
      { href: "/routes", label: "Routes", icon: RouteIcon, roles: ["ADMIN"] },
      { href: "/locations", label: "Locations", icon: MapPin, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"] }],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`border-r border-slate-200 bg-white transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-800">
          {collapsed ? "FC" : "Freight Control"}
        </span>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>
      <nav className="space-y-4 px-2 py-3 text-sm">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {section.label}
              </div>
            )}
            <ul className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium ${
                        active
                          ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}


