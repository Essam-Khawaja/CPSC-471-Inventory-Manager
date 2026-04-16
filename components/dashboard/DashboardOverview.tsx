import Link from "next/link";
import { getPool } from "@/lib/db";

type DashboardProps = {
  warehouseIds: number[];
  userName: string;
};

export async function DashboardOverview({ warehouseIds, userName }: DashboardProps) {
  const pool = getPool();
  const hasWarehouses = warehouseIds.length > 0;

  // Build a reusable parameterised IN-clause for warehouse filtering
  const whParams = warehouseIds.map((_, i) => `$${i + 1}`).join(",");

  // Warehouse location IDs (needed to filter shipments)
  let locationIds: number[] = [];
  if (hasWarehouses) {
    const locRes = await pool.query(
      `SELECT DISTINCT location_id FROM warehouses WHERE warehouse_id IN (${whParams})`,
      warehouseIds
    );
    locationIds = locRes.rows.map((r: { location_id: number }) => r.location_id);
  }
  const locParams = locationIds.map((_, i) => `$${i + 1}`).join(",");

  // Shipment IDs scoped to this user's warehouses
  let scopedShipmentIds: number[] = [];
  if (locationIds.length > 0) {
    const shipIdRes = await pool.query(
      `SELECT shipment_id FROM shipments WHERE origin_loc_id IN (${locParams}) OR destination_loc_id IN (${locParams})`,
      locationIds
    );
    scopedShipmentIds = shipIdRes.rows.map((r: { shipment_id: number }) => r.shipment_id);
  }

  // KPIs
  let inTransit = 0, pending = 0, delivered = 0, containerCount = 0, cargoTypeCount = 0, warehouseCount = 0;

  if (hasWarehouses) {
    if (locationIds.length > 0) {
      const locParamsForStatus = locationIds.map((_, i) => `$${i + 2}`).join(",");
      const [itRes, pRes, dRes] = await Promise.all([
        pool.query(`SELECT COUNT(*) AS c FROM shipments WHERE status=$1 AND (origin_loc_id IN (${locParamsForStatus}) OR destination_loc_id IN (${locParamsForStatus}))`, ['IN_TRANSIT', ...locationIds]),
        pool.query(`SELECT COUNT(*) AS c FROM shipments WHERE status=$1 AND (origin_loc_id IN (${locParamsForStatus}) OR destination_loc_id IN (${locParamsForStatus}))`, ['PENDING', ...locationIds]),
        pool.query(`SELECT COUNT(*) AS c FROM shipments WHERE status=$1 AND (origin_loc_id IN (${locParamsForStatus}) OR destination_loc_id IN (${locParamsForStatus}))`, ['DELIVERED', ...locationIds]),
      ]);
      inTransit = Number(itRes.rows[0].c);
      pending = Number(pRes.rows[0].c);
      delivered = Number(dRes.rows[0].c);
    }

    if (scopedShipmentIds.length > 0) {
      const sParams = scopedShipmentIds.map((_, i) => `$${i + 1}`).join(",");
      const contRes = await pool.query(`SELECT COUNT(*) AS c FROM containers WHERE shipment_id IN (${sParams})`, scopedShipmentIds);
      containerCount = Number(contRes.rows[0].c);
    }

    const cargoRes = await pool.query(
      `SELECT COUNT(DISTINCT cargo_id) AS c FROM inventory_records WHERE warehouse_id IN (${whParams})`,
      warehouseIds
    );
    cargoTypeCount = Number(cargoRes.rows[0].c);
    warehouseCount = warehouseIds.length;
  }

  // Top carriers (scoped to user's shipments)
  type CarrierRow = { name: string; carrier_type: string; cnt: string };
  let topCarriers: CarrierRow[] = [];
  if (locationIds.length > 0) {
    const carrierRes = await pool.query(
      `SELECT c.name, c.carrier_type, COUNT(s.shipment_id) AS cnt
       FROM carriers c
       JOIN shipments s ON s.carrier_id = c.carrier_id
       WHERE s.origin_loc_id IN (${locParams}) OR s.destination_loc_id IN (${locParams})
       GROUP BY c.carrier_id, c.name, c.carrier_type
       HAVING COUNT(s.shipment_id) > 0
       ORDER BY cnt DESC LIMIT 8`,
      locationIds
    );
    topCarriers = carrierRes.rows;
  }

  // Warehouse capacity (only user's warehouses)
  type WhRow = { warehouse_id: number; name: string; capacity: number; used_weight: string | number };
  let warehouses: WhRow[] = [];
  if (hasWarehouses) {
    const whCapRes = await pool.query(
      `SELECT w.warehouse_id, w.name, w.capacity,
              COALESCE(v.total_weight, 0) AS used_weight
       FROM warehouses w
       LEFT JOIN view_warehouse_inventory v ON v.warehouse_id = w.warehouse_id
       WHERE w.warehouse_id IN (${whParams})
       ORDER BY w.warehouse_id`,
      warehouseIds
    );
    warehouses = whCapRes.rows;
  }

  // Recent shipments (scoped)
  type ShipRow = { shipment_id: number; status: string; shipment_date: Date | string | null; carrier_name: string; origin: string; dest: string };
  let recentShipments: ShipRow[] = [];
  if (locationIds.length > 0) {
    const recentRes = await pool.query(
      `SELECT s.shipment_id, s.status, s.shipment_date, c.name AS carrier_name,
              lo.location_name AS origin, ld.location_name AS dest
       FROM shipments s
       JOIN carriers c ON c.carrier_id = s.carrier_id
       JOIN locations lo ON lo.location_id = s.origin_loc_id
       JOIN locations ld ON ld.location_id = s.destination_loc_id
       WHERE s.origin_loc_id IN (${locParams}) OR s.destination_loc_id IN (${locParams})
       ORDER BY s.shipment_date DESC LIMIT 8`,
      locationIds
    );
    recentShipments = recentRes.rows;
  }

  const totalShipments = inTransit + pending + delivered;

  const kpis = [
    { label: "In Transit", value: inTransit, color: "text-sky-500" },
    { label: "Pending", value: pending, color: "text-amber-500" },
    { label: "Delivered", value: delivered, color: "text-emerald-500" },
    { label: "Containers", value: containerCount, color: "text-violet-500" },
    { label: "Cargo Types", value: cargoTypeCount, color: "text-rose-500" },
    { label: "Warehouses", value: warehouseCount, color: "text-teal-500" },
  ];

  const maxCarrier = Math.max(1, ...topCarriers.map(c => Number(c.cnt)));

  const noData = !hasWarehouses;

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Operations Dashboard</h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">
          {noData
            ? "You are not assigned to any warehouses yet. Contact your administrator."
            : `${userName}: ${totalShipments} shipments across ${warehouseCount} warehouse${warehouseCount !== 1 ? "s" : ""}`}
        </p>
      </section>

      {noData ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          No warehouse assignments found for your account. Ask an admin to assign you to a warehouse.
        </div>
      ) : (
        <>
          <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
            {kpis.map((k) => (
              <div key={k.label} className="rounded border border-slate-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">{k.label}</div>
                <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Top Carriers</h2>
                  <Link href="/carriers" className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">View All</Link>
                </div>
                <div className="mt-2 space-y-1.5">
                  {topCarriers.length === 0 && <p className="text-xs text-slate-400 py-2">No carrier activity for your warehouses.</p>}
                  {topCarriers.map((c) => {
                    const cnt = Number(c.cnt);
                    const pct = Math.round((cnt / maxCarrier) * 100);
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-700 dark:text-neutral-300">{c.name} <span className="text-slate-400">· {c.carrier_type}</span></span>
                          <span className="font-semibold text-slate-800 dark:text-neutral-200">{cnt}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
                          <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Recent Shipments</h2>
                  <Link href="/shipments" className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">View All</Link>
                </div>
                <div className="mt-2 overflow-x-auto">
                  {recentShipments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No shipments for your warehouses.</p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-neutral-800">
                          <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                          <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Status</th>
                          <th className="px-2 py-1 text-left font-semibold text-slate-600 dark:text-neutral-400">Date</th>
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
                            <td className="px-2 py-1.5 text-slate-700 dark:text-neutral-300">{s.shipment_date ? new Date(s.shipment_date as string).toLocaleDateString() : "-"}</td>
                            <td className="px-2 py-1.5 text-slate-700 dark:text-neutral-300">{s.carrier_name}</td>
                            <td className="px-2 py-1.5 text-[10px] text-slate-500 dark:text-neutral-400">{s.origin} → {s.dest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Warehouse Capacity</h2>
                <Link href="/inventory" className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">Inventory</Link>
              </div>
              <div className="mt-2 flex-1 space-y-2.5 overflow-y-auto pr-1">
                {warehouses.map((w) => {
                  const used = Number(w.used_weight ?? 0);
                  const pct = w.capacity > 0 ? Math.round((used / w.capacity) * 1000) / 10 : 0;
                  const barWidth = Math.min(pct, 100);
                  const overCap = pct > 100;
                  const barColor = overCap ? "bg-red-600" : pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
                  const label = overCap ? "overcapacity" : pct >= 90 ? "critical" : pct >= 70 ? "monitor" : "stable";
                  const labelColor = overCap ? "text-red-500" : pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500";
                  return (
                    <div key={w.warehouse_id} className="rounded border border-slate-100 px-2.5 py-2 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-700 dark:text-neutral-300">{w.name}</span>
                        <span className="flex items-center gap-1">
                          {overCap && <span className="text-red-500 font-bold text-xs" title="Immediate attention required">!</span>}
                          <span className={`text-[10px] font-semibold ${labelColor}`}>{pct}% · {label}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
                        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>{used.toLocaleString()} / {w.capacity.toLocaleString()} kg</span>
                        {overCap && <span className="font-semibold text-red-500">OVERCAPACITY</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
