import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

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
      <Sidebar />
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
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Carrier
              </button>
            </header>

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

