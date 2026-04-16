"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const segmentLabels: Record<string, string> = {
  inventory: "Inventory",
  shipments: "Shipments",
  containers: "Containers",
  cargo: "Cargo Items",
  warehouses: "Warehouses",
  carriers: "Carriers",
  routes: "Routes",
  locations: "Locations",
  reports: "Reports",
  users: "Users",
  admin: "Admin",
  approvals: "Approvals",
  staff: "Staff",
  "request-admin": "Request Admin",
  "admin-requests": "Admin Requests",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: segmentLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400">
      <Link
        href="/"
        className="hover:text-slate-800 dark:hover:text-neutral-200 transition-colors"
      >
        Dashboard
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {c.isLast ? (
            <span className="font-medium text-slate-800 dark:text-neutral-200">
              {c.label}
            </span>
          ) : (
            <Link
              href={c.href}
              className="hover:text-slate-800 dark:hover:text-neutral-200 transition-colors"
            >
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
