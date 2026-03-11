import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-slate-50 px-6 py-4">
          <section className="space-y-3">
            <header>
              <h1 className="text-base font-semibold text-slate-900">
                Analytical Reports
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                High-level reports such as container utilization, carrier
                performance, and warehouse capacity.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Container Utilization by Type
                </h2>
                <p className="text-[11px] text-slate-500">
                  Summary based on active shipments and container assignments.
                </p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li className="flex items-center justify-between">
                    <span className="text-slate-700">40ft Dry</span>
                    <span className="text-slate-700">78% utilized</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-700">20ft Reefer</span>
                    <span className="text-slate-700">63% utilized</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Carrier On-Time Performance
                </h2>
                <p className="text-[11px] text-slate-500">
                  Based on historical shipment arrival data.
                </p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li className="flex items-center justify-between">
                    <span className="text-slate-700">AirFast</span>
                    <span className="text-emerald-600">94% on-time</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-700">SeaBridge</span>
                    <span className="text-amber-600">81% on-time</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

