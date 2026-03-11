import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const warehouses = [
  { code: "WH-01", name: "Calgary Main", admin: "Admin User", location: "Calgary, AB", capacityUsed: "64%" },
  { code: "WH-02", name: "Vancouver Port", admin: "Admin User", location: "Vancouver, BC", capacityUsed: "82%" },
];

export default function WarehousesPage() {
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
                      Code
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Admin
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Capacity Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((wh) => (
                    <tr key={wh.code} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{wh.code}</td>
                      <td className="px-3 py-2 text-slate-800">{wh.name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {wh.location}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{wh.admin}</td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {wh.capacityUsed}
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

