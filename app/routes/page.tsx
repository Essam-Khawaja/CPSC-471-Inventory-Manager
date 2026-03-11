import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createRoute(formData: FormData) {
  "use server";
  const timeRaw = String(formData.get("estimated_time") ?? "").trim();
  const time = Number(timeRaw);
  if (!Number.isFinite(time) || time <= 0) {
    return;
  }
  const pool = getPool();
  await pool.query(
    "INSERT INTO routes (estimated_time) VALUES ($1)",
    [time]
  );
  revalidatePath("/routes");
}

async function deleteRoute(formData: FormData) {
  "use server";
  const idRaw = String(formData.get("route_id") ?? "").trim();
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM routes WHERE route_id = $1", [id]);
  revalidatePath("/routes");
}

export default async function RoutesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT route_id, estimated_time FROM routes ORDER BY route_id"
  );
  const routes = result.rows as {
    route_id: number;
    estimated_time: number;
  }[];
  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-slate-50 px-6 py-4">
          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-semibold text-slate-900">
                  Routes
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Define standard shipment routes between locations.
                </p>
              </div>
            </header>

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Create New Route
              </h2>
              <form
                action={createRoute}
                className="mt-2 grid gap-2 text-xs md:grid-cols-2"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="estimated_time"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Estimated Time
                  </label>
                  <input
                    id="estimated_time"
                    name="estimated_time"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-2">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Route
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Route ID
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Estimated Time
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.route_id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">
                        {r.route_id}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {r.estimated_time}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        <form action={deleteRoute} className="inline">
                          <input
                            type="hidden"
                            name="route_id"
                            value={r.route_id}
                          />
                          <button
                            type="submit"
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

