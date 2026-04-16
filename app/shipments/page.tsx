import { LayoutShell } from "@/components/layout/LayoutShell";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createShipment(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const shipmentDateRaw = String(formData.get("shipment_date") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const carrierId = Number(String(formData.get("carrier_id") ?? "").trim());
  const routeId = Number(String(formData.get("route_id") ?? "").trim());
  const originLocId = Number(String(formData.get("origin_loc_id") ?? "").trim());
  const destinationLocId = Number(String(formData.get("destination_loc_id") ?? "").trim());

  if (!shipmentDateRaw) redirect(`/shipments?error=${encodeURIComponent("Shipment date is required.")}`);
  if (!status) redirect(`/shipments?error=${encodeURIComponent("Status is required.")}`);
  if (!Number.isInteger(carrierId) || carrierId <= 0) redirect(`/shipments?error=${encodeURIComponent("Please select a carrier.")}`);
  if (!Number.isInteger(routeId) || routeId <= 0) redirect(`/shipments?error=${encodeURIComponent("Please select a route.")}`);
  if (!Number.isInteger(originLocId) || originLocId <= 0) redirect(`/shipments?error=${encodeURIComponent("Please select an origin location.")}`);
  if (!Number.isInteger(destinationLocId) || destinationLocId <= 0) redirect(`/shipments?error=${encodeURIComponent("Please select a destination.")}`);
  if (originLocId === destinationLocId) redirect(`/shipments?error=${encodeURIComponent("Origin and destination cannot be the same.")}`);

  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO shipments (shipment_date, status, carrier_id, route_id, origin_loc_id, destination_loc_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [shipmentDateRaw, status, carrierId, routeId, originLocId, destinationLocId]
    );
  } catch {
    redirect(`/shipments?error=${encodeURIComponent("Failed to create shipment. Check that all foreign keys are valid.")}`);
  }

  revalidatePath("/shipments");
  redirect("/shipments");
}

type ShipmentsPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function ShipmentsPage({ searchParams }: ShipmentsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const statusFilter = (params.status ?? "").trim();
  const error = (params.error ?? "").trim();

  const pool = getPool();
  const carriersResult = await pool.query("SELECT carrier_id, name FROM carriers ORDER BY carrier_id");
  const carriers = carriersResult.rows as { carrier_id: number; name: string }[];
  const routesResult = await pool.query("SELECT route_id, estimated_time FROM routes ORDER BY route_id");
  const routes = routesResult.rows as { route_id: number; estimated_time: number }[];
  const locationsResult = await pool.query("SELECT location_id, location_name FROM locations ORDER BY location_name");
  const locations = locationsResult.rows as { location_id: number; location_name: string }[];

  const values: string[] = [];
  let whereClause = "";
  if (statusFilter) {
    whereClause = "WHERE status = $1";
    values.push(statusFilter);
  }

  const result = await pool.query(
    `SELECT s.shipment_id, s.status, s.shipment_date, c.name AS carrier_name,
            r.estimated_time, lo.location_name AS origin_name, ld.location_name AS dest_name
     FROM shipments s
     JOIN carriers c ON c.carrier_id = s.carrier_id
     JOIN routes r ON r.route_id = s.route_id
     JOIN locations lo ON lo.location_id = s.origin_loc_id
     JOIN locations ld ON ld.location_id = s.destination_loc_id
     ${whereClause}
     ORDER BY s.shipment_id
     LIMIT 500`,
    values
  );
  const shipments = result.rows as {
    shipment_id: number; status: string; shipment_date: Date | null;
    carrier_name: string; estimated_time: number; origin_name: string; dest_name: string;
  }[];

  const statusOptions = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
  const inputCls = "rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

  return (
    <LayoutShell role={user.role}>
      <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Shipments</h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">Manage freight shipments, assigned routes, and carriers.</p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</div>
        )}

        {user.role === "ADMIN" && (
          <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Create New Shipment</h2>
            <form action={createShipment} className="mt-2 grid gap-2 text-xs sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="shipment_date" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Shipment Date</label>
                <input id="shipment_date" name="shipment_date" type="date" required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="status" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Status</label>
                <select id="status" name="status" required className={inputCls}>
                  <option value="">Select status...</option>
                  {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="carrier_id" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Carrier</label>
                <select id="carrier_id" name="carrier_id" required className={inputCls}>
                  <option value="">Select carrier...</option>
                  {carriers.map((c) => (<option key={c.carrier_id} value={c.carrier_id}>{c.name}</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="route_id" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Route (est. days)</label>
                <select id="route_id" name="route_id" required className={inputCls}>
                  <option value="">Select route...</option>
                  {routes.map((r) => (<option key={r.route_id} value={r.route_id}>Route {r.route_id} - {r.estimated_time} days</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="origin_loc_id" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Origin</label>
                <select id="origin_loc_id" name="origin_loc_id" required className={inputCls}>
                  <option value="">Select origin...</option>
                  {locations.map((loc) => (<option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="destination_loc_id" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Destination</label>
                <select id="destination_loc_id" name="destination_loc_id" required className={inputCls}>
                  <option value="">Select destination...</option>
                  {locations.map((loc) => (<option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>))}
                </select>
              </div>
              <div className="mt-2 sm:col-span-2 md:col-span-3">
                <button type="submit" className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700">Save Shipment</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
            <form action="/shipments" method="GET" className="flex items-center gap-2">
              <label htmlFor="filter_status" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Status:</label>
              <select id="filter_status" name="status" defaultValue={statusFilter} className={inputCls}>
                <option value="">All</option>
                {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <button type="submit" className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">Apply</button>
            </form>
            <span>{shipments.length} record{shipments.length !== 1 ? "s" : ""}{statusFilter && ` · ${statusFilter}`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Carrier</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Est. Days</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Origin</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Destination</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.shipment_id} className="border-b border-slate-100 dark:border-neutral-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{s.shipment_id}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        s.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                        s.status === "IN_TRANSIT" ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" :
                        s.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{s.shipment_date ? new Date(s.shipment_date).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{s.carrier_name}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-neutral-300">{s.estimated_time}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{s.origin_name}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{s.dest_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}
