import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function WarehousesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT warehouse_id, name, address, capacity, location_id FROM warehouses ORDER BY warehouse_id"
  );
  const warehouses = result.rows as {
    warehouse_id: number;
    name: string;
    address: string;
    capacity: number;
    location_id: number;
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
                  Warehouses
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Maintain warehouse master data and responsible admins.
                </p>
              </div>
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Warehouse
              </button>
            </header>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
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

