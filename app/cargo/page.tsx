import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const cargo = [
  {
    code: "CARGO-001",
    description: "Consumer Electronics",
    weight: "12,000 kg",
    status: "In Warehouse",
    warehouse: "WH-01",
    container: "-",
  },
  {
    code: "CARGO-078",
    description: "Industrial Machinery",
    weight: "24,500 kg",
    status: "In Transit",
    warehouse: "-",
    container: "CONT-001",
  },
];

export default function CargoPage() {
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
                      Code
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Weight
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Warehouse
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Container
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargo.map((item) => (
                    <tr key={item.code} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{item.code}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {item.weight}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.status}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.warehouse}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.container}
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

