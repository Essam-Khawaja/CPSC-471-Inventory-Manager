import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function assignContainerToShipment(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const containerIdRaw = String(formData.get("container_id") ?? "").trim();
  const shipmentIdRaw = String(formData.get("shipment_id") ?? "").trim();

  const containerId = Number(containerIdRaw);
  const shipmentId = Number(shipmentIdRaw);

  if (!Number.isInteger(containerId) || !Number.isInteger(shipmentId)) {
    redirect(
      `/containers?error=${encodeURIComponent(
        "Invalid container or shipment ID. Please enter whole numbers."
      )}`
    );
  }

  const pool = getPool();
  try {
    await pool.query(
      "UPDATE containers SET shipment_id = $1 WHERE container_id = $2",
      [shipmentId, containerId]
    );
  } catch (error) {
    console.error("Error assigning container to shipment", error);
    redirect(
      `/containers?error=${encodeURIComponent(
        "Failed to assign container. Check that the shipment exists."
      )}`
    );
  }

  revalidatePath("/containers");
  redirect("/containers");
}

type ContainersPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ContainersPage({ searchParams }: ContainersPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const params = await searchParams;
  const error = (params.error ?? "").trim();

  const pool = getPool();
  const result = await pool.query(
    "SELECT container_id, container_type, max_capacity, shipment_id FROM containers ORDER BY container_id"
  );
  const containers = result.rows as {
    container_id: number;
    container_type: string;
    max_capacity: number;
    shipment_id: number | null;
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
                  Containers
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Track container assignments, status, and capacity utilization.
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
                Assign Container to Shipment
              </h2>
              <form
                action={assignContainerToShipment}
                className="mt-2 grid gap-2 text-xs md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="container_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Container ID
                  </label>
                  <input
                    id="container_id"
                    name="container_id"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="shipment_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Shipment ID
                  </label>
                  <input
                    id="shipment_id"
                    name="shipment_id"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-3">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Container ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Container Type
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Max Capacity (kg)
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Shipment ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((c) => (
                    <tr
                      key={c.container_id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {c.container_id}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.container_type}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {c.max_capacity}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.shipment_id ?? "-"}
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

