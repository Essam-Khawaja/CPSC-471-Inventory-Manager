import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createWarehouse(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const locationIdRaw = String(formData.get("location_id") ?? "").trim();

  if (!name || !address || !capacityRaw || !locationIdRaw) {
    return;
  }

  const capacity = Number(capacityRaw);
  const locationId = Number(locationIdRaw);
  if (!Number.isFinite(capacity) || capacity <= 0 || !Number.isInteger(locationId)) {
    return;
  }

  const pool = getPool();
  await pool.query(
    "INSERT INTO warehouses (name, address, capacity, location_id) VALUES ($1, $2, $3, $4)",
    [name, address, capacity, locationId]
  );
  revalidatePath("/warehouses");
}

async function deleteWarehouse(formData: FormData) {
  "use server";
  const idRaw = String(formData.get("warehouse_id") ?? "").trim();
  const id = Number(idRaw);
  if (!Number.isInteger(id)) {
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM warehouses WHERE warehouse_id = $1", [id]);
  revalidatePath("/warehouses");
}

type WarehousesPageProps = {
  searchParams: Promise<{
    page?: string;
    location_id?: string;
  }>;
};

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  const params = await searchParams;
  const pageParam = Number(params.page ?? "1");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const locationFilterRaw = (params.location_id ?? "").trim();
  const locationFilter = locationFilterRaw ? Number(locationFilterRaw) : null;

  const pool = getPool();
  const locationsResult = await pool.query(
    "SELECT location_id, location_name FROM locations ORDER BY location_name"
  );

  const values: (number)[] = [];
  let whereClause = "";
  if (locationFilter && Number.isInteger(locationFilter)) {
    whereClause = "WHERE location_id = $1";
    values.push(locationFilter);
  }
  values.push(pageSize, offset);

  const query = `
    SELECT warehouse_id, name, address, capacity, location_id
    FROM warehouses
    ${whereClause}
    ORDER BY warehouse_id
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await pool.query(query, values);
  const warehouses = result.rows as {
    warehouse_id: number;
    name: string;
    address: string;
    capacity: number;
    location_id: number;
  }[];
  const locations = locationsResult.rows as {
    location_id: number;
    location_name: string;
  }[];
  const hasNextPage = warehouses.length === pageSize;
  const baseUrl = "/warehouses";

  const makeUrl = (targetPage: number) => {
    const search = new URLSearchParams();
    if (targetPage > 1) search.set("page", String(targetPage));
    if (locationFilter && Number.isInteger(locationFilter)) {
      search.set("location_id", String(locationFilter));
    }
    const qs = search.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

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
                  Warehouses
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Maintain warehouse master data and responsible admins.
                </p>
              </div>
            </header>

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Create New Warehouse
              </h2>
              <form
                action={createWarehouse}
                className="mt-2 grid gap-2 text-xs md:grid-cols-4"
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
                    htmlFor="address"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="capacity"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="location_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Location
                  </label>
                  <select
                    id="location_id"
                    name="location_id"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select location…</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 md:col-span-4">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Warehouse
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600">
                <form
                  action={baseUrl}
                  method="GET"
                  className="flex items-center gap-2"
                >
                  <span className="font-medium">Filter by location:</span>
                  <select
                    name="location_id"
                    defaultValue={locationFilter ?? ""}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">All</option>
                    {locations.map((loc) => (
                      <option
                        key={loc.location_id}
                        value={loc.location_id}
                      >
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Apply
                  </button>
                </form>
                <span>
                  Page {page}
                  {locationFilter && ` · Location ID: ${locationFilter}`}
                </span>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Warehouse ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Address
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Capacity
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Location ID
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((wh) => (
                    <tr key={wh.warehouse_id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">
                        {wh.warehouse_id}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{wh.name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {wh.address}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {wh.capacity}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {wh.location_id}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        <form action={deleteWarehouse} className="inline">
                          <input
                            type="hidden"
                            name="warehouse_id"
                            value={wh.warehouse_id}
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
              <div className="flex items-center justify-end border-t border-slate-200 px-3 py-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <a
                      href={makeUrl(page - 1)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Previous
                    </a>
                  )}
                  {hasNextPage && (
                    <a
                      href={makeUrl(page + 1)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Next
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

