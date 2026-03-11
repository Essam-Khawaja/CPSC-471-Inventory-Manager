import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const shipments = [
  {
    code: "SHP-2026-001",
    status: "In Transit",
    carrier: "AirFast",
    route: "Calgary → Toronto",
    containers: 4,
    departure: "2026-03-10",
  },
  {
    code: "SHP-2026-002",
    status: "Planned",
    carrier: "SeaBridge",
    route: "Vancouver → Tokyo",
    containers: 6,
    departure: "2026-03-18",
  },
];

export default function ShipmentsPage() {
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
                      Code
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Carrier
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Route
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Containers
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Departure
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s.code} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{s.code}</td>
                      <td className="px-3 py-2 text-slate-800">{s.status}</td>
                      <td className="px-3 py-2 text-slate-700">{s.carrier}</td>
                      <td className="px-3 py-2 text-slate-700">{s.route}</td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {s.containers}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {s.departure}
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

