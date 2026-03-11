import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const routes = [
  {
    code: "RT-CA-TO",
    origin: "Calgary, AB",
    destination: "Toronto, ON",
    days: 2,
  },
  {
    code: "RT-VA-TK",
    origin: "Vancouver, BC",
    destination: "Tokyo, JP",
    days: 9,
  },
];

export default function RoutesPage() {
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
                  Routes
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Define standard shipment routes between locations.
                </p>
              </div>
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Route
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
                      Origin
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Destination
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Est. Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.code} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{r.code}</td>
                      <td className="px-3 py-2 text-slate-700">{r.origin}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {r.destination}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {r.days}
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

