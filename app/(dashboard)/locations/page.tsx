import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createLocation(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const name = String(formData.get("location_name") ?? "").trim();
  const type = String(formData.get("location_type") ?? "").trim().toUpperCase();
  if (!name) redirect(`/locations?error=${encodeURIComponent("Location name is required.")}`);
  if (!type) redirect(`/locations?error=${encodeURIComponent("Location type is required.")}`);
  const valid = ["WAREHOUSE", "PORT", "AIRPORT", "RAIL_TERMINAL", "DISTRIBUTION"];
  if (!valid.includes(type)) redirect(`/locations?error=${encodeURIComponent("Type must be WAREHOUSE, PORT, AIRPORT, RAIL_TERMINAL, or DISTRIBUTION.")}`);

  const pool = getPool();
  await pool.query("INSERT INTO locations (location_name, location_type) VALUES ($1, $2)", [name, type]);
  revalidatePath("/locations");
}

async function deleteLocation(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const id = Number(String(formData.get("location_id") ?? "").trim());
  if (!Number.isInteger(id)) return;

  const pool = getPool();
  try {
    const wRef = await pool.query("SELECT 1 FROM warehouses WHERE location_id = $1 LIMIT 1", [id]);
    if ((wRef.rowCount ?? 0) > 0) redirect(`/locations?error=${encodeURIComponent("Cannot delete: location is used by a warehouse.")}`);
    const sRef = await pool.query("SELECT 1 FROM shipments WHERE origin_loc_id = $1 OR destination_loc_id = $1 LIMIT 1", [id]);
    if ((sRef.rowCount ?? 0) > 0) redirect(`/locations?error=${encodeURIComponent("Cannot delete: location is used in shipments.")}`);
    await pool.query("DELETE FROM locations WHERE location_id = $1", [id]);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    redirect(`/locations?error=${encodeURIComponent("Cannot delete location: it may be referenced by other records.")}`);
  }
  revalidatePath("/locations");
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LocationsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const error = (params.error ?? "").trim();

  const pool = getPool();
  const result = await pool.query("SELECT location_id, location_name, location_type FROM locations ORDER BY location_id LIMIT 500");
  const locations = result.rows as { location_id: number; location_name: string; location_type: string }[];
  const inputCls = "rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";
  const typeOptions = ["WAREHOUSE", "PORT", "AIRPORT", "RAIL_TERMINAL", "DISTRIBUTION"];

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Locations</h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">Master data for shipment origin and destination locations.</p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</div>
        )}

        <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Create New Location</h2>
          <form action={createLocation} className="mt-2 grid gap-2 text-xs sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="location_name" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Location Name</label>
              <input id="location_name" name="location_name" required className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="location_type" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Location Type</label>
              <select id="location_type" name="location_type" required className={inputCls}>
                <option value="">Select type...</option>
                {typeOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div className="mt-2 sm:col-span-2 md:col-span-3">
              <button type="submit" className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700">Save Location</button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Type</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.location_id} className="border-b border-slate-100 dark:border-neutral-800">
                  <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{loc.location_id}</td>
                  <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{loc.location_name}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{loc.location_type}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteLocation} className="inline">
                      <input type="hidden" name="location_id" value={loc.location_id} />
                      <button type="submit" className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </section>
  );
}
