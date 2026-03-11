import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createShipment(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const shipmentDateRaw = String(formData.get("shipment_date") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const carrierIdRaw = String(formData.get("carrier_id") ?? "").trim();
  const routeIdRaw = String(formData.get("route_id") ?? "").trim();
  const originLocIdRaw = String(formData.get("origin_loc_id") ?? "").trim();
  const destinationLocIdRaw = String(
    formData.get("destination_loc_id") ?? ""
  ).trim();

  if (
    !shipmentDateRaw ||
    !status ||
    !carrierIdRaw ||
    !routeIdRaw ||
    !originLocIdRaw ||
    !destinationLocIdRaw
  ) {
    redirect(
      `/shipments?error=${encodeURIComponent(
        "All fields are required to create a shipment."
      )}`
    );
  }

  const carrierId = Number(carrierIdRaw);
  const routeId = Number(routeIdRaw);
  const originLocId = Number(originLocIdRaw);
  const destinationLocId = Number(destinationLocIdRaw);

  if (
    !Number.isInteger(carrierId) ||
    !Number.isInteger(routeId) ||
    !Number.isInteger(originLocId) ||
    !Number.isInteger(destinationLocId)
  ) {
    redirect(
      `/shipments?error=${encodeURIComponent(
        "Carrier, route, and location IDs must be whole numbers."
      )}`
    );
  }

  const pool = getPool();
  try {
    await pool.query(
      `
      INSERT INTO shipments (shipment_date, status, carrier_id, route_id, origin_loc_id, destination_loc_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        shipmentDateRaw,
        status,
        carrierId,
        routeId,
        originLocId,
        destinationLocId,
      ]
    );
  } catch (error) {
    console.error("Error creating shipment", error);
    redirect(
      `/shipments?error=${encodeURIComponent(
        "Failed to create shipment. Check foreign keys (carrier/route/locations)."
      )}`
    );
  }

  revalidatePath("/shipments");
  redirect("/shipments");
}

type ShipmentsPageProps = {
  searchParams: Promise<{
    page?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function ShipmentsPage({ searchParams }: ShipmentsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const pageParam = Number(params.page ?? "1");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const statusFilter = (params.status ?? "").trim();
  const error = (params.error ?? "").trim();

  const pool = getPool();

  const statusResult = await pool.query(
    "SELECT DISTINCT status FROM shipments ORDER BY status"
  );
  const statuses = statusResult.rows as { status: string }[];

  const carriersResult = await pool.query(
    "SELECT carrier_id, name FROM carriers ORDER BY carrier_id"
  );
  const carriers = carriersResult.rows as {
    carrier_id: number;
    name: string;
  }[];

  const routesResult = await pool.query(
    "SELECT route_id, estimated_time FROM routes ORDER BY route_id"
  );
  const routes = routesResult.rows as {
    route_id: number;
    estimated_time: number;
  }[];

  const locationsResult = await pool.query(
    "SELECT location_id, location_name FROM locations ORDER BY location_id"
  );
  const locations = locationsResult.rows as {
    location_id: number;
    location_name: string;
  }[];

  const values: (string | number)[] = [];
  let whereClause = "";

  if (statusFilter) {
    whereClause = "WHERE status = $1";
    values.push(statusFilter);
  }

  values.push(pageSize, offset);

  const query = `
    SELECT shipment_id, status, shipment_date, carrier_id, route_id, origin_loc_id, destination_loc_id
    FROM shipments
    ${whereClause}
    ORDER BY shipment_id
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await pool.query(query, values);
  const shipments = result.rows as {
    shipment_id: number;
    status: string;
    shipment_date: Date | null;
    carrier_id: number;
    route_id: number;
    origin_loc_id: number;
    destination_loc_id: number;
  }[];

  const hasNextPage = shipments.length === pageSize;
  const baseUrl = "/shipments";

  const makeUrl = (targetPage: number) => {
    const search = new URLSearchParams();
    if (targetPage > 1) search.set("page", String(targetPage));
    if (statusFilter) search.set("status", statusFilter);
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
                  Shipments
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Manage freight shipments, assigned routes, and carriers.
                </p>
              </div>
            </header>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Create New Shipment
              </h2>
              <form
                action={createShipment}
                className="mt-2 grid gap-2 text-xs md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="shipment_date"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Shipment Date
                  </label>
                  <input
                    id="shipment_date"
                    name="shipment_date"
                    type="date"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="status"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <input
                    id="status"
                    name="status"
                    placeholder="IN_TRANSIT, PLANNED, etc."
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="carrier_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Carrier
                  </label>
                  <select
                    id="carrier_id"
                    name="carrier_id"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select carrier…</option>
                    {carriers.map((c) => (
                      <option key={c.carrier_id} value={c.carrier_id}>
                        {c.carrier_id} – {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="route_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Route
                  </label>
                  <select
                    id="route_id"
                    name="route_id"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select route…</option>
                    {routes.map((r) => (
                      <option key={r.route_id} value={r.route_id}>
                        {r.route_id} – {r.estimated_time}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="origin_loc_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Origin Location
                  </label>
                  <select
                    id="origin_loc_id"
                    name="origin_loc_id"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select origin…</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_id} – {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="destination_loc_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Destination Location
                  </label>
                  <select
                    id="destination_loc_id"
                    name="destination_loc_id"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select destination…</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_id} – {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 md:col-span-3">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Shipment
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
                  <label
                    htmlFor="status"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={statusFilter}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">All</option>
                    {statuses.map((s) => (
                      <option key={s.status} value={s.status}>
                        {s.status}
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
                  {statusFilter && ` · Status: ${statusFilter}`}
                </span>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Shipment ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Shipment Date
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Carrier ID
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Route ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Origin Location ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Destination Location ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr
                      key={s.shipment_id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {s.shipment_id}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{s.status}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {s.shipment_date
                          ? new Date(s.shipment_date).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {s.carrier_id}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {s.route_id}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {s.origin_loc_id}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {s.destination_loc_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[11px] text-slate-600">
                <span>
                  Page {page}
                  {statusFilter && ` · Status: ${statusFilter}`}
                </span>
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

