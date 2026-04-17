import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createWarehouse(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const locationIdRaw = String(formData.get("location_id") ?? "").trim();

  if (!name || !address || !capacityRaw || !locationIdRaw) {
    redirect(`/warehouses?error=${encodeURIComponent("All fields are required.")}`);
  }

  const capacity = Number(capacityRaw);
  const locationId = Number(locationIdRaw);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    redirect(`/warehouses?error=${encodeURIComponent("Capacity must be a positive number.")}`);
  }
  if (!Number.isInteger(locationId)) {
    redirect(`/warehouses?error=${encodeURIComponent("Please select a valid location.")}`);
  }

  const pool = getPool();
  try {
    await pool.query(
      "INSERT INTO warehouses (name, address, capacity, location_id) VALUES ($1, $2, $3, $4)",
      [name, address, capacity, locationId]
    );
  } catch {
    redirect(`/warehouses?error=${encodeURIComponent("Failed to create warehouse. The selected location may not exist.")}`);
  }
  revalidatePath("/warehouses");
}

async function deleteWarehouse(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const id = Number(String(formData.get("warehouse_id") ?? "").trim());
  if (!Number.isInteger(id)) redirect(`/warehouses?error=${encodeURIComponent("Invalid warehouse ID.")}`);

  const pool = getPool();
  try {
    const refs = await pool.query("SELECT 1 FROM inventory_records WHERE warehouse_id = $1 LIMIT 1", [id]);
    if ((refs.rowCount ?? 0) > 0) {
      redirect(`/warehouses?error=${encodeURIComponent("Cannot delete warehouse: it has inventory records. Remove them first.")}`);
    }
    await pool.query("DELETE FROM warehouses WHERE warehouse_id = $1", [id]);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    redirect(`/warehouses?error=${encodeURIComponent("Cannot delete warehouse: it may be referenced by other records.")}`);
  }
  revalidatePath("/warehouses");
}

type WarehousesPageProps = {
  searchParams: Promise<{ location_id?: string; error?: string }>;
};

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const locationFilterRaw = (params.location_id ?? "").trim();
  const locationFilter = locationFilterRaw ? Number(locationFilterRaw) : null;
  const error = (params.error ?? "").trim();

  const pool = getPool();
  const locationsResult = await pool.query("SELECT location_id, location_name FROM locations ORDER BY location_name");

  const values: number[] = [];
  let whereClause = "";
  if (locationFilter && Number.isInteger(locationFilter)) {
    whereClause = "WHERE location_id = $1";
    values.push(locationFilter);
  }

  const result = await pool.query(
    `SELECT warehouse_id, name, address, capacity, location_id
     FROM warehouses ${whereClause}
     ORDER BY warehouse_id
     LIMIT 500`,
    values
  );
  const warehouses = result.rows as { warehouse_id: number; name: string; address: string; capacity: number; location_id: number }[];
  const locations = locationsResult.rows as { location_id: number; location_name: string }[];

  const inputCls = "rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Warehouses</h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">Maintain warehouse master data, locations, and capacity.</p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</div>
        )}

        <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Create New Warehouse</h2>
          <form action={createWarehouse} className="mt-2 grid gap-2 text-xs sm:grid-cols-2 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Name</label>
              <input id="name" name="name" required className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="address" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Address</label>
              <input id="address" name="address" required className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="capacity" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Capacity</label>
              <input id="capacity" name="capacity" type="number" min={1} required className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="location_id" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Location</label>
              <select id="location_id" name="location_id" required className={inputCls}>
                <option value="">Select location...</option>
                {locations.map((loc) => (<option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>))}
              </select>
            </div>
            <div className="mt-2 sm:col-span-2 md:col-span-4">
              <button type="submit" className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700">Save Warehouse</button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 dark:border-neutral-800 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
            <form action="/warehouses" method="GET" className="flex items-center gap-2">
              <span className="font-medium">Filter by location:</span>
              <select name="location_id" defaultValue={locationFilter ?? ""} className={inputCls}>
                <option value="">All</option>
                {locations.map((loc) => (<option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>))}
              </select>
              <button type="submit" className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">Apply</button>
            </form>
            <span>{warehouses.length} record{warehouses.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Address</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Capacity</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Location ID</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => (
                  <tr key={wh.warehouse_id} className="border-b border-slate-100 dark:border-neutral-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{wh.warehouse_id}</td>
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{wh.name}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{wh.address}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-neutral-300">{wh.capacity}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-neutral-300">{wh.location_id}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteWarehouse} className="inline">
                        <input type="hidden" name="warehouse_id" value={wh.warehouse_id} />
                        <button type="submit" className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </section>
  );
}
