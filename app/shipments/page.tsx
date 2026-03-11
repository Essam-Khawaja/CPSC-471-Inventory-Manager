import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ShipmentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT shipment_id, status, shipment_date, carrier_id, route_id, origin_loc_id, destination_loc_id FROM shipments ORDER BY shipment_id"
  );
  const shipments = result.rows as {
    shipment_id: number;
    status: string;
    shipment_date: Date | null;
    carrier_id: number;
    route_id: number;
    origin_loc_id: number;
    destination_loc_id: number;
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
                  Shipments
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Manage freight shipments, assigned routes, and carriers.
                </p>
              </div>
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Shipment
              </button>
            </header>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
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
  {s.shipment_date ? new Date(s.shipment_date).toLocaleString() : "-"}
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
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

