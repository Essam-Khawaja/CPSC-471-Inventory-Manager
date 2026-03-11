import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const containers = [
  {
    code: "CONT-001",
    type: "40ft Dry",
    status: "In Use",
    shipment: "SHP-2026-001",
    capacity: "28t",
    utilization: "76%",
  },
  {
    code: "CONT-014",
    type: "20ft Reefer",
    status: "Available",
    shipment: "-",
    capacity: "18t",
    utilization: "0%",
  },
];

export default function ContainersPage() {
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
                      Code
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Shipment
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Capacity
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((c) => (
                    <tr key={c.code} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{c.code}</td>
                      <td className="px-3 py-2 text-slate-700">{c.type}</td>
                      <td className="px-3 py-2 text-slate-700">{c.status}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.shipment}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {c.capacity}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {c.utilization}
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

