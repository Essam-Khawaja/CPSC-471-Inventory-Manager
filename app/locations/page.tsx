import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createLocation(formData: FormData) {
  "use server";
  const name = String(formData.get("location_name") ?? "").trim();
  const type = String(formData.get("location_type") ?? "").trim();
  if (!name || !type) {
    return;
  }
  const pool = getPool();
  await pool.query(
    "INSERT INTO locations (location_name, location_type) VALUES ($1, $2)",
    [name, type]
  );
  revalidatePath("/locations");
}

async function deleteLocation(formData: FormData) {
  "use server";
  const idRaw = String(formData.get("location_id") ?? "").trim();
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM locations WHERE location_id = $1", [id]);
  revalidatePath("/locations");
}

export default async function LocationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT location_id, location_name, location_type FROM locations ORDER BY location_id"
  );
  const locations = result.rows as {
    location_id: number;
    location_name: string;
    location_type: string;
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
                  Locations
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Master data for shipment origin and destination locations.
                </p>
              </div>
            </header>

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Create New Location
              </h2>
              <form
                action={createLocation}
                className="mt-2 grid gap-2 text-xs md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="location_name"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Location Name
                  </label>
                  <input
                    id="location_name"
                    name="location_name"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="location_type"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Location Type
                  </label>
                  <input
                    id="location_type"
                    name="location_type"
                    placeholder="WAREHOUSE, PORT, etc."
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-3">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Location
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Location ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Location Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Location Type
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.location_id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">
                        {loc.location_id}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {loc.location_name}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {loc.location_type}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        <form action={deleteLocation} className="inline">
                          <input
                            type="hidden"
                            name="location_id"
                            value={loc.location_id}
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

