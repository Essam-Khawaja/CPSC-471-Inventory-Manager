"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/warehouses", label: "Warehouses" },
      { href: "/inventory", label: "Inventory" },
      { href: "/shipments", label: "Shipments" },
      { href: "/containers", label: "Containers" },
      { href: "/cargo", label: "Cargo Items" },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/carriers", label: "Carriers" },
      { href: "/routes", label: "Routes" },
      { href: "/locations", label: "Locations" },
    ],
  },
  {
    label: "Analytics",
    items: [{ href: "/reports", label: "Reports" }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center rounded px-2 py-1.5 text-xs font-medium ${
                        active
                          ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {!collapsed && <span>{item.label}</span>}
                      {collapsed && (
                        <span className="text-[11px]">
                          {item.label.charAt(0)}
                        </span>
                      )}
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

