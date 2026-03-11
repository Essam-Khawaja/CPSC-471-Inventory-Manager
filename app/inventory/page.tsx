import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT cargo_id, warehouse_id, quantity_stored, last_updated FROM inventory_records ORDER BY warehouse_id, cargo_id"
  );
  const inventory = result.rows as {
    cargo_id: number;
    warehouse_id: number;
    quantity_stored: number;
    last_updated: Date;
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
                  Inventory Records
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  View and maintain inventory records per warehouse and cargo
                  item.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                  Adjust Quantity
                </button>
                <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                  Move to Container
                </button>
              </div>
            </header>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cargo ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Warehouse ID
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Quantity Stored
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((row) => (
                    <tr
                      key={`${row.warehouse_id}-${row.cargo_id}`}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {row.cargo_id}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {row.warehouse_id}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {row.quantity_stored}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
  {new Date(row.last_updated).toLocaleString()}
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

