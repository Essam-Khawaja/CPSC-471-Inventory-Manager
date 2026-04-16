import { LayoutShell } from "@/components/layout/LayoutShell";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const pool = getPool();

  const [[shipRes], [contRes], [cargoRes], [whRes], [locRes]] = await Promise.all([
    pool.query("SELECT COUNT(*) AS c FROM shipments").then(r => r.rows),
    pool.query("SELECT COUNT(*) AS c FROM containers").then(r => r.rows),
    pool.query("SELECT COUNT(*) AS c FROM cargo_items").then(r => r.rows),
    pool.query("SELECT COUNT(*) AS c FROM warehouses").then(r => r.rows),
    pool.query("SELECT COUNT(*) AS c FROM locations").then(r => r.rows),
  ]);

  const statusRes = await pool.query("SELECT status, COUNT(*) AS cnt FROM shipments GROUP BY status ORDER BY status");
  const statusBreakdown = statusRes.rows as { status: string; cnt: string }[];

  const topCarriersRes = await pool.query(
    `SELECT c.name, c.carrier_type, COUNT(s.shipment_id) AS shipment_count
     FROM carriers c LEFT JOIN shipments s ON s.carrier_id = c.carrier_id
     GROUP BY c.carrier_id, c.name, c.carrier_type
     ORDER BY shipment_count DESC LIMIT 10`
  );
  const topCarriers = topCarriersRes.rows as { name: string; carrier_type: string; shipment_count: string }[];
  const maxCarrierCount = Math.max(1, ...topCarriers.map(c => Number(c.shipment_count)));

  const capacityRes = await pool.query(
    `SELECT w.warehouse_id, w.name AS warehouse_name, w.capacity,
            COALESCE(v.total_weight, 0) AS used_weight
     FROM warehouses w
     LEFT JOIN view_warehouse_inventory v ON v.warehouse_id = w.warehouse_id
     ORDER BY w.warehouse_id`
  );
  const warehouseCapacity = capacityRes.rows as { warehouse_id: number; warehouse_name: string; capacity: number; used_weight: string | number }[];

  const whInvRes = await pool.query(
    "SELECT warehouse_id, warehouse_name, total_units, total_weight FROM view_warehouse_inventory ORDER BY warehouse_id LIMIT 50"
  );
  const warehouseInventory = whInvRes.rows as { warehouse_id: number; warehouse_name: string; total_units: number | null; total_weight: string | number | null }[];

  const shipSumRes = await pool.query(
    "SELECT shipment_id, status, shipment_date, carrier_name, container_count, cargo_item_count FROM view_shipment_summary ORDER BY shipment_id DESC LIMIT 50"
  );
  const shipmentSummary = shipSumRes.rows as { shipment_id: number; status: string; shipment_date: Date | string | null; carrier_name: string; container_count: number; cargo_item_count: number }[];

  const contUtilRes = await pool.query(
    `SELECT c.container_id, c.container_type, c.max_capacity,
            COALESCE(SUM(ci.weight), 0) AS current_weight,
            CASE WHEN c.max_capacity > 0
              THEN ROUND((COALESCE(SUM(ci.weight), 0) / c.max_capacity) * 100, 1)
              ELSE 0 END AS utilization_pct
     FROM containers c
     LEFT JOIN container_cargo cc ON cc.container_id = c.container_id
     LEFT JOIN cargo_items ci ON ci.cargo_id = cc.cargo_id
     GROUP BY c.container_id, c.container_type, c.max_capacity
     ORDER BY utilization_pct DESC LIMIT 50`
  );
  const containerUtil = contUtilRes.rows as { container_id: number; container_type: string; max_capacity: string | number; current_weight: string | number; utilization_pct: string | number }[];

  const contTypeRes = await pool.query("SELECT container_type, COUNT(*) AS cnt FROM containers GROUP BY container_type ORDER BY cnt DESC");
  const contTypes = contTypeRes.rows as { container_type: string; cnt: string }[];
  const maxContType = Math.max(1, ...contTypes.map(c => Number(c.cnt)));

  const recentRes = await pool.query(
    `SELECT s.shipment_id, s.status, s.shipment_date, c.name AS carrier_name,
            lo.location_name AS origin, ld.location_name AS dest
     FROM shipments s
     JOIN carriers c ON c.carrier_id = s.carrier_id
     JOIN locations lo ON lo.location_id = s.origin_loc_id
     JOIN locations ld ON ld.location_id = s.destination_loc_id
     ORDER BY s.shipment_date DESC LIMIT 10`
  );
  const recentShipments = recentRes.rows as { shipment_id: number; status: string; shipment_date: Date | string | null; carrier_name: string; origin: string; dest: string }[];

  const statusTextColor: Record<string, string> = {
    DELIVERED: "text-emerald-400", IN_TRANSIT: "text-sky-400", PENDING: "text-amber-400", CANCELLED: "text-red-400",
  };

  const tileCls = "space-y-2 rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900";
  const tileHeadCls = "text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400";
  const scrollCls = "max-h-[320px] overflow-y-auto";

  return (
    <LayoutShell role={user.role}>
      <section className="space-y-4">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Analytical Reports</h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">Live metrics, utilization, and activity across the freight network.</p>
        </header>

        {/* KPI Cards */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {[
            { label: "Total Shipments", value: shipRes.c },
            { label: "Containers", value: contRes.c },
            { label: "Cargo Items", value: cargoRes.c },
            { label: "Warehouses", value: whRes.c },
            { label: "Locations", value: locRes.c },
          ].map((k) => (
            <div key={k.label} className="rounded border border-slate-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">{k.label}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-neutral-100">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Row 1: Shipment Status + Top Carriers */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className={tileCls}>
            <h2 className={tileHeadCls}>Shipment Status Breakdown</h2>
            <div className="grid grid-cols-2 gap-2">
              {statusBreakdown.map((s) => {
                const total = Number(shipRes.c) || 1;
                const cnt = Number(s.cnt);
                const pct = Math.round((cnt / total) * 100);
                const circ = Math.round((cnt / total) * 283);
                return (
                  <div key={s.status} className="flex items-center gap-3 rounded border border-slate-100 px-3 py-2 dark:border-neutral-800">
                    <svg width="48" height="48" viewBox="0 0 100 100" className="shrink-0">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-neutral-800" />
                      <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8"
                        stroke="currentColor"
                        strokeDasharray={`${circ} 283`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ color: s.status === "DELIVERED" ? "#10b981" : s.status === "IN_TRANSIT" ? "#0ea5e9" : s.status === "PENDING" ? "#f59e0b" : "#ef4444" }}
                      />
                      <text x="50" y="54" textAnchor="middle" className="fill-slate-800 dark:fill-neutral-100" style={{ fontSize: "24px", fontWeight: 700 }}>{pct}%</text>
                    </svg>
                    <div>
                      <div className={`text-sm font-bold ${statusTextColor[s.status] ?? "text-slate-400"}`}>{cnt}</div>
                      <div className="text-[10px] text-slate-500 dark:text-neutral-400">{s.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={tileCls}>
            <h2 className={tileHeadCls}>Top Carriers by Shipment Volume</h2>
            <div className={scrollCls + " space-y-1.5"}>
              {topCarriers.map((c) => {
                const cnt = Number(c.shipment_count);
                const pct = Math.round((cnt / maxCarrierCount) * 100);
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-neutral-300">{c.name} <span className="text-slate-400">({c.carrier_type})</span></span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">{cnt}</span>
                    </div>
                    <div className="mt-0.5 h-2 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Warehouse Capacity + Container Type */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className={tileCls}>
            <h2 className={tileHeadCls}>Warehouse Capacity Utilization</h2>
            <div className={scrollCls + " space-y-2"}>
              {warehouseCapacity.map((w) => {
                const used = Number(w.used_weight ?? 0);
                const pct = w.capacity > 0 ? Math.round((used / w.capacity) * 1000) / 10 : 0;
                const barWidth = Math.min(pct, 100);
                const barColor = pct > 100 ? "bg-red-600" : pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
                const overCap = pct > 100;
                return (
                  <div key={w.warehouse_id}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-neutral-300">{w.warehouse_name}</span>
                      <span className="flex items-center gap-1">
                        {overCap && <span className="text-red-500 font-bold text-xs" title="Immediate attention required">!</span>}
                        <span className={`font-semibold ${overCap ? "text-red-500" : "text-slate-800 dark:text-neutral-200"}`}>{pct}%</span>
                      </span>
                    </div>
                    <div className="mt-0.5 h-2.5 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
                      <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{used.toLocaleString()} / {w.capacity.toLocaleString()} kg</span>
                      {overCap && <span className="font-semibold text-red-500">OVERCAPACITY - immediate attention required</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={tileCls}>
            <h2 className={tileHeadCls}>Container Type Distribution</h2>
            <div className={scrollCls + " space-y-1.5"}>
              {contTypes.map((c) => {
                const cnt = Number(c.cnt);
                const pct = Math.round((cnt / maxContType) * 100);
                return (
                  <div key={c.container_type}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-neutral-300">{c.container_type}</span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">{cnt}</span>
                    </div>
                    <div className="mt-0.5 h-2 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
                      <div className="h-2 rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Recent Shipments + Warehouse Inventory */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className={tileCls}>
            <h2 className={tileHeadCls}>Recent Shipment Activity</h2>
            <div className={scrollCls}>
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                  <tr className="border-b border-slate-200 dark:border-neutral-800">
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Status</th>
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Carrier</th>
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((s) => (
                    <tr key={s.shipment_id} className="border-b border-slate-100 dark:border-neutral-800">
                      <td className="px-2 py-1.5 text-slate-800 dark:text-neutral-200">{s.shipment_id}</td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-block rounded px-1 py-0.5 text-[10px] font-semibold ${
                          s.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                          s.status === "IN_TRANSIT" ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" :
                          s.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                          "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-2 py-1.5 text-slate-700 dark:text-neutral-300">{s.carrier_name}</td>
                      <td className="px-2 py-1.5 text-[10px] text-slate-500 dark:text-neutral-400">{s.origin} → {s.dest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={tileCls}>
            <h2 className={tileHeadCls}>Warehouse Inventory Summary</h2>
            <div className={scrollCls}>
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                  <tr className="border-b border-slate-200 dark:border-neutral-800">
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Warehouse</th>
                    <th className="px-2 py-1 text-right font-semibold text-slate-600 dark:text-neutral-400">Units</th>
                    <th className="px-2 py-1 text-right font-semibold text-slate-600 dark:text-neutral-400">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseInventory.map((w) => (
                    <tr key={w.warehouse_id} className="border-b border-slate-100 dark:border-neutral-800">
                      <td className="px-2 py-1.5 text-slate-800 dark:text-neutral-200">{w.warehouse_name}</td>
                      <td className="px-2 py-1.5 text-right text-slate-700 dark:text-neutral-300">{w.total_units ?? 0}</td>
                      <td className="px-2 py-1.5 text-right text-slate-700 dark:text-neutral-300">{Number(w.total_weight ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 4: Shipment Summary + Container Utilization */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className={tileCls}>
            <h2 className={tileHeadCls}>Shipment Detail Summary</h2>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">From view_shipment_summary (last 50)</p>
            <div className={scrollCls}>
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                  <tr className="border-b border-slate-200 dark:border-neutral-800">
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Status</th>
                    <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Carrier</th>
                    <th className="px-2 py-1 text-right font-semibold text-slate-600 dark:text-neutral-400">Cont.</th>
                    <th className="px-2 py-1 text-right font-semibold text-slate-600 dark:text-neutral-400">Cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentSummary.map((s) => (
                    <tr key={s.shipment_id} className="border-b border-slate-100 dark:border-neutral-800">
                      <td className="px-2 py-1.5 text-slate-800 dark:text-neutral-200">{s.shipment_id}</td>
                      <td className="px-2 py-1.5 text-slate-700 dark:text-neutral-300">{s.status}</td>
                      <td className="px-2 py-1.5 text-slate-700 dark:text-neutral-300">{s.carrier_name}</td>
                      <td className="px-2 py-1.5 text-right text-slate-700 dark:text-neutral-300">{s.container_count}</td>
                      <td className="px-2 py-1.5 text-right text-slate-700 dark:text-neutral-300">{s.cargo_item_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={tileCls}>
            <h2 className={tileHeadCls}>Container Utilization (Top 50)</h2>
            <div className={scrollCls + " space-y-1.5"}>
              {containerUtil.map((c) => {
                const pct = Number(c.utilization_pct);
                const barWidth = Math.min(pct, 100);
                const overCap = pct > 100;
                const barColor = overCap ? "bg-red-600" : pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : pct > 0 ? "bg-emerald-500" : "bg-slate-400";
                return (
                  <div key={c.container_id}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-neutral-300">#{c.container_id} {c.container_type}</span>
                      <span className="flex items-center gap-1">
                        {overCap && <span className="text-red-500 font-bold text-xs" title="Immediate attention required">!</span>}
                        <span className={`font-semibold ${overCap ? "text-red-500" : "text-slate-800 dark:text-neutral-200"}`}>{pct}%</span>
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
                      <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.max(barWidth, 1)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}
