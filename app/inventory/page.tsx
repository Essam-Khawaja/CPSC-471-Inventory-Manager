import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const inventory = [
  {
    warehouse: "WH-01",
    cargoCode: "CARGO-001",
    description: "Electronics Pallet",
    quantity: 10,
    location: "Aisle 03 · Bin 12",
    lastUpdatedBy: "Staff-01",
  },
  {
    warehouse: "WH-01",
    cargoCode: "CARGO-045",
    description: "Textiles Roll",
    quantity: 22,
    location: "Aisle 07 · Bin 04",
    lastUpdatedBy: "Staff-02",
  },
];

export default function InventoryPage() {
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
                  Inventory Records
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  View and maintain inventory records per warehouse and cargo
                  item.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                  Adjust Quantity
                </button>
                <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50">
                  Move to Container
                </button>
              </div>
            </header>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Warehouse
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cargo Code
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Quantity
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Last Updated By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((row) => (
                    <tr
                      key={`${row.warehouse}-${row.cargoCode}`}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {row.warehouse}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {row.cargoCode}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.description}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.location}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.lastUpdatedBy}
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

