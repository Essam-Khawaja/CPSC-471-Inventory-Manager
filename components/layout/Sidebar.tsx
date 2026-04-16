"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { CreditsModal } from "./CreditsModal";
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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type Role = "ADMIN" | "STAFF" | "UNKNOWN";

type SidebarProps = {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
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

export function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
        ${collapsed ? "w-14" : "w-56"}
      `}
    >
      {/* Mobile close button */}
      <div className="flex h-10 items-center justify-between px-2 lg:hidden">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-500">
          Menu
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop collapse toggle */}
      <div className="hidden h-10 items-center px-2 lg:flex">
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-1 text-sm">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                {section.label}
              </div>
            )}
            {collapsed && <div className="mx-auto my-1 h-px w-6 bg-slate-200 dark:bg-neutral-700" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      title={item.label}
                      className={`flex items-center rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                        collapsed ? "justify-center" : "gap-2"
                      } ${
                        active
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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

      {/* Bottom actions */}
      <div className="border-t border-slate-200 px-2 py-2 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          title="Credits"
          className={`mb-1 flex w-full items-center rounded px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${
            collapsed ? "justify-center" : "gap-2"
          }`}
        >
          <Users className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Credits</span>}
        </button>

        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          className={`flex w-full items-center rounded px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${
            collapsed ? "justify-center" : "gap-2"
          }`}
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

      <CreditsModal
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
      />
    </aside>
  );
}
