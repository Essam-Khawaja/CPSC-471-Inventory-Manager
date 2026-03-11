import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ContainersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
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
      <Sidebar />
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
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Container
              </button>
            </header>

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

