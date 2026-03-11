import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CargoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT cargo_id, cargo_type, weight FROM cargo_items ORDER BY cargo_id"
  );
  const cargo = result.rows as {
    cargo_id: number;
    cargo_type: string;
    weight: number;
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
                  Cargo Items
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Master data for cargo items and their current location.
                </p>
              </div>
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Cargo Item
              </button>
            </header>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cargo ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cargo Type
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Weight (kg)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargo.map((item) => (
                    <tr key={item.cargo_id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">
                        {item.cargo_id}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.cargo_type}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {item.weight}
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

