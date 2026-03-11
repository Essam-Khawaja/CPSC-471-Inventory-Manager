import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createCarrier(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("carrier_type") ?? "").trim();
  if (!name || !type) {
    return;
  }
  const pool = getPool();
  await pool.query(
    "INSERT INTO carriers (name, carrier_type) VALUES ($1, $2)",
    [name, type]
  );
  revalidatePath("/carriers");
}

async function deleteCarrier(formData: FormData) {
  "use server";
  const idRaw = String(formData.get("carrier_id") ?? "").trim();
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM carriers WHERE carrier_id = $1", [id]);
  revalidatePath("/carriers");
}

export default async function CarriersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT carrier_id, name, carrier_type FROM carriers ORDER BY carrier_id"
  );
  const carriers = result.rows as {
    carrier_id: number;
    name: string;
    carrier_type: string;
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
                  Carriers
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Maintain master data for external carriers.
                </p>
              </div>
            </header>

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Create New Carrier
              </h2>
              <form
                action={createCarrier}
                className="mt-2 grid gap-2 text-xs md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="name"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="carrier_type"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Carrier Type
                  </label>
                  <input
                    id="carrier_type"
                    name="carrier_type"
                    placeholder="AIR, SEA, RAIL, etc."
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-3">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Carrier
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Carrier ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Carrier Type
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.map((c) => (
                    <tr key={c.carrier_id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">
                        {c.carrier_id}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{c.name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.carrier_type}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        <form action={deleteCarrier} className="inline">
                          <input
                            type="hidden"
                            name="carrier_id"
                            value={c.carrier_id}
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

