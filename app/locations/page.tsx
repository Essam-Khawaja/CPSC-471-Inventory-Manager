import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const locations = [
  { name: "Calgary Main Warehouse", type: "Warehouse", city: "Calgary", country: "CA" },
  { name: "Vancouver Port Terminal", type: "Port", city: "Vancouver", country: "CA" },
];

export default function LocationsPage() {
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
                  Locations
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Master data for shipment origin and destination locations.
                </p>
              </div>
              <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                New Location
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
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      City
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Country
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.name} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{loc.name}</td>
                      <td className="px-3 py-2 text-slate-700">{loc.type}</td>
                      <td className="px-3 py-2 text-slate-700">{loc.city}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {loc.country}
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

