import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createRoute(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const time = Number(String(formData.get("estimated_time") ?? "").trim());
  if (!Number.isInteger(time) || time <= 0) redirect(`/routes?error=${encodeURIComponent("Estimated time must be a positive whole number (days).")}`);

  const pool = getPool();
  await pool.query("INSERT INTO routes (estimated_time) VALUES ($1)", [time]);
  revalidatePath("/routes");
}

async function deleteRoute(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const id = Number(String(formData.get("route_id") ?? "").trim());
  if (!Number.isInteger(id)) return;

  const pool = getPool();
  try {
    const refs = await pool.query("SELECT 1 FROM shipments WHERE route_id = $1 LIMIT 1", [id]);
    if ((refs.rowCount ?? 0) > 0) redirect(`/routes?error=${encodeURIComponent("Cannot delete: route is used by existing shipments.")}`);
    await pool.query("DELETE FROM routes WHERE route_id = $1", [id]);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    redirect(`/routes?error=${encodeURIComponent("Cannot delete route: it may be referenced by other records.")}`);
  }
  revalidatePath("/routes");
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function RoutesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const error = (params.error ?? "").trim();

  const pool = getPool();
  const result = await pool.query("SELECT route_id, estimated_time FROM routes ORDER BY route_id LIMIT 500");
  const routes = result.rows as { route_id: number; estimated_time: number }[];
  const inputCls = "rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Routes</h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">Define standard shipment routes with estimated transit times.</p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</div>
        )}

        <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Create New Route</h2>
          <form action={createRoute} className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="estimated_time" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Estimated Time (days)</label>
              <input id="estimated_time" name="estimated_time" type="number" min={1} required className={inputCls} />
            </div>
            <div className="mt-2 sm:col-span-2">
              <button type="submit" className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700">Save Route</button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Route ID</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Est. Time (days)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.route_id} className="border-b border-slate-100 dark:border-neutral-800">
                  <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{r.route_id}</td>
                  <td className="px-3 py-2 text-right text-slate-700 dark:text-neutral-300">{r.estimated_time}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteRoute} className="inline">
                      <input type="hidden" name="route_id" value={r.route_id} />
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
