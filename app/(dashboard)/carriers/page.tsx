import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createCarrier(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("carrier_type") ?? "").trim().toUpperCase();
  if (!name) redirect(`/carriers?error=${encodeURIComponent("Carrier name is required.")}`);
  if (!type) redirect(`/carriers?error=${encodeURIComponent("Carrier type is required.")}`);
  const valid = ["AIR", "SEA", "RAIL", "ROAD"];
  if (!valid.includes(type)) redirect(`/carriers?error=${encodeURIComponent("Carrier type must be AIR, SEA, RAIL, or ROAD.")}`);

  const pool = getPool();
  await pool.query("INSERT INTO carriers (name, carrier_type) VALUES ($1, $2)", [name, type]);
  revalidatePath("/carriers");
}

async function deleteCarrier(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const id = Number(String(formData.get("carrier_id") ?? "").trim());
  if (!Number.isInteger(id)) redirect(`/carriers?error=${encodeURIComponent("Invalid carrier ID.")}`);

  const pool = getPool();
  try {
    const refs = await pool.query("SELECT 1 FROM shipments WHERE carrier_id = $1 LIMIT 1", [id]);
    if ((refs.rowCount ?? 0) > 0) redirect(`/carriers?error=${encodeURIComponent("Cannot delete: carrier is used by existing shipments.")}`);
    await pool.query("DELETE FROM carriers WHERE carrier_id = $1", [id]);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    redirect(`/carriers?error=${encodeURIComponent("Cannot delete carrier: it may be referenced by other records.")}`);
  }
  revalidatePath("/carriers");
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function CarriersPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const error = (params.error ?? "").trim();

  const pool = getPool();
  const result = await pool.query("SELECT carrier_id, name, carrier_type FROM carriers ORDER BY carrier_id LIMIT 500");
  const carriers = result.rows as { carrier_id: number; name: string; carrier_type: string }[];
  const inputCls = "rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Carriers</h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">Maintain master data for external carriers.</p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</div>
        )}

        <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">Create New Carrier</h2>
          <form action={createCarrier} className="mt-2 grid gap-2 text-xs sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Name</label>
              <input id="name" name="name" required className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="carrier_type" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">Carrier Type</label>
              <select id="carrier_type" name="carrier_type" required className={inputCls}>
                <option value="">Select type...</option>
                <option value="AIR">AIR</option>
                <option value="SEA">SEA</option>
                <option value="RAIL">RAIL</option>
                <option value="ROAD">ROAD</option>
              </select>
            </div>
            <div className="mt-2 sm:col-span-2 md:col-span-3">
              <button type="submit" className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700">Save Carrier</button>
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
              {carriers.map((c) => (
                <tr key={c.carrier_id} className="border-b border-slate-100 dark:border-neutral-800">
                  <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{c.carrier_id}</td>
                  <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{c.name}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{c.carrier_type}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteCarrier} className="inline">
                      <input type="hidden" name="carrier_id" value={c.carrier_id} />
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
