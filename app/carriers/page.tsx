import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const carriers = [
  { name: "AirFast", contact: "ops@airfast.com", status: "Active" },
  { name: "SeaBridge", contact: "support@seabridge.com", status: "Active" },
];

export default function CarriersPage() {
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
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.map((c) => (
                    <tr key={c.name} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{c.name}</td>
                      <td className="px-3 py-2 text-slate-700">{c.contact}</td>
                      <td className="px-3 py-2 text-slate-700">{c.status}</td>
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

