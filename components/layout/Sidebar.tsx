"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
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
  ShieldCheck,
  UserPlus,
  Sun,
  Moon,
  X,
} from "lucide-react";

type Role = "ADMIN" | "STAFF" | "UNKNOWN";

type SidebarProps = {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
};

// Navigation sections with role-based visibility
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
    label: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
      { href: "/admin/approvals/users", label: "Approve Users", icon: UserPlus, roles: ["ADMIN"] },
      { href: "/admin/approvals/admin-requests", label: "Admin Requests", icon: ShieldCheck, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Staff",
    items: [
      { href: "/staff/request-admin", label: "Request Admin", icon: ShieldCheck, roles: ["STAFF"] },
    ],
  },
];

// Sidebar navigation with collapsible desktop mode and drawer on mobile
export function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Filter sections and items to only those the current role can see
  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white
        transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900
        lg:sticky lg:top-0 lg:z-auto lg:h-screen
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Header with title and collapse/close buttons */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 dark:border-neutral-800">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-800 dark:text-neutral-200">
          {collapsed ? "FC" : "Freight Control"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 lg:inline-block"
          >
            {collapsed ? "\u203A" : "\u2039"}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3 text-sm">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-500">
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
                      onClick={onClose}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium ${
                        active
                          ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-700"
                          : "text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
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

      {/* Dark mode toggle at the bottom of the sidebar */}
      <div className="border-t border-slate-200 px-2 py-3 dark:border-neutral-800">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Moon className="h-4 w-4 flex-shrink-0" />
          )}
          {!collapsed && (
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
