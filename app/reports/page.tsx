import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  const pool = getPool();

  const warehouseResult = await pool.query(
    "SELECT warehouse_id, warehouse_name, total_units, total_weight FROM view_warehouse_inventory ORDER BY warehouse_id"
  );
  const warehouseInventory = warehouseResult.rows as {
    warehouse_id: number;
    warehouse_name: string;
    total_units: number | null;
    total_weight: string | number | null;
  }[];

  const shipmentResult = await pool.query(
    "SELECT shipment_id, status, shipment_date, carrier_name, container_count, cargo_item_count FROM view_shipment_summary ORDER BY shipment_id"
  );
  const shipmentSummary = shipmentResult.rows as {
    shipment_id: number;
    status: string;
    shipment_date: Date | string | null;
    carrier_name: string;
    container_count: number;
    cargo_item_count: number;
  }[];

  const containerUtilResult = await pool.query(
    `
    SELECT
      c.container_id,
      c.container_type,
      c.max_capacity,
      COALESCE(SUM(ci.weight), 0) AS current_weight,
      CASE
        WHEN c.max_capacity > 0
        THEN ROUND((COALESCE(SUM(ci.weight), 0) / c.max_capacity) * 100, 1)
        ELSE NULL
      END AS utilization_pct
    FROM containers c
    LEFT JOIN container_cargo cc ON cc.container_id = c.container_id
    LEFT JOIN cargo_items ci ON ci.cargo_id = cc.cargo_id
    GROUP BY c.container_id, c.container_type, c.max_capacity
    ORDER BY c.container_id
    `
  );
  const containerUtilization = containerUtilResult.rows as {
    container_id: number;
    container_type: string;
    max_capacity: string | number;
    current_weight: string | number;
    utilization_pct: string | number | null;
  }[];

  const capacityResult = await pool.query(
    `
    SELECT
      w.warehouse_id,
      w.name AS warehouse_name,
      w.capacity,
      COALESCE(v.total_weight, 0) AS used_weight
    FROM warehouses w
    LEFT JOIN view_warehouse_inventory v
      ON v.warehouse_id = w.warehouse_id
    ORDER BY w.warehouse_id
    `
  );
  const warehouseCapacity = capacityResult.rows as {
    warehouse_id: number;
    warehouse_name: string;
    capacity: number;
    used_weight: string | number;
  }[];

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-slate-50 px-6 py-4">
          <section className="space-y-3">
            <header>
              <h1 className="text-base font-semibold text-slate-900">
                Analytical Reports
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                High-level reports based on database views.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Warehouse Inventory Summary
                </h2>
                <p className="text-[11px] text-slate-500">
                  Data from view_warehouse_inventory.
                </p>
                <table className="mt-1 w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 py-1 text-left font-semibold text-slate-600">
                        Warehouse
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Total Units
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Total Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseInventory.map((w) => (
                      <tr key={w.warehouse_id} className="border-b border-slate-100">
                        <td className="px-2 py-1.5 text-slate-800">
                          {w.warehouse_name}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {w.total_units ?? 0}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {w.total_weight ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Shipment Summary
                </h2>
                <p className="text-[11px] text-slate-500">
                  Data from view_shipment_summary.
                </p>
                <table className="mt-1 w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 py-1 text-left font-semibold text-slate-600">
                        Shipment ID
                      </th>
                      <th className="px-2 py-1 text-left font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-2 py-1 text-left font-semibold text-slate-600">
                        Carrier
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Containers
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Cargo Items
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipmentSummary.map((s) => (
                      <tr key={s.shipment_id} className="border-b border-slate-100">
                        <td className="px-2 py-1.5 text-slate-800">
                          {s.shipment_id}
                        </td>
                        <td className="px-2 py-1.5 text-slate-700">
                          {s.status}
                        </td>
                        <td className="px-2 py-1.5 text-slate-700">
                          {s.carrier_name}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {s.container_count}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {s.cargo_item_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Container Utilization
                </h2>
                <p className="text-[11px] text-slate-500">
                  Utilization per container based on assigned cargo weights.
                </p>
                <table className="mt-1 w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 py-1 text-left font-semibold text-slate-600">
                        Container
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Current Weight
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Max Capacity
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Utilization %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {containerUtilization.map((c) => (
                      <tr key={c.container_id} className="border-b border-slate-100">
                        <td className="px-2 py-1.5 text-slate-800">
                          {c.container_id} – {c.container_type}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {c.current_weight ?? 0}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {c.max_capacity}
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-700">
                          {c.utilization_pct ?? 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Warehouse Capacity vs Usage
                </h2>
                <p className="text-[11px] text-slate-500">
                  Compares warehouse capacity to total stored cargo weight.
                </p>
                <table className="mt-1 w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 py-1 text-left font-semibold text-slate-600">
                        Warehouse
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Capacity
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Used Weight
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-slate-600">
                        Utilization %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseCapacity.map((w) => {
                      const used = Number(w.used_weight ?? 0);
                      const pct =
                        w.capacity > 0
                          ? Math.round((used / w.capacity) * 1000) / 10
                          : 0;
                      return (
                        <tr key={w.warehouse_id} className="border-b border-slate-100">
                          <td className="px-2 py-1.5 text-slate-800">
                            {w.warehouse_name}
                          </td>
                          <td className="px-2 py-1.5 text-right text-slate-700">
                            {w.capacity}
                          </td>
                          <td className="px-2 py-1.5 text-right text-slate-700">
                            {used}
                          </td>
                          <td className="px-2 py-1.5 text-right text-slate-700">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

