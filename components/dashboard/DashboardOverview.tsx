import Link from "next/link";

const kpiCards = [
  { label: "Shipments In Transit", value: 2, hint: "COUNT(*) WHERE status = 'IN_TRANSIT'" },
  { label: "Total Containers", value: 2, hint: "COUNT(*) FROM containers" },
  { label: "Total Cargo Items", value: 2, hint: "COUNT(*) FROM cargo_items" },
  { label: "Total Warehouses", value: 1, hint: "COUNT(*) FROM warehouses" },
];

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-base font-semibold text-slate-900">
          Admin Operations Dashboard
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          High-level view of shipments, warehouse inventory, and container
          utilization for the current admin.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded border border-slate-200 bg-white px-3 py-3"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900">
              {card.value}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{card.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded border border-slate-200 bg-white p-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Shipment Status Overview
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Breakdown of active shipments by status and carrier.
              </p>
            </div>
            <Link
              href="/shipments"
              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Go to Shipments
            </Link>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-1 text-left font-semibold text-slate-600">
                  Carrier
                </th>
                <th className="px-2 py-1 text-right font-semibold text-slate-600">
                  Planned
                </th>
                <th className="px-2 py-1 text-right font-semibold text-slate-600">
                  In Transit
                </th>
                <th className="px-2 py-1 text-right font-semibold text-slate-600">
                  Delivered (30d)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { carrier: "AirFast", planned: 3, inTransit: 5, delivered: 12 },
                {
                  carrier: "SeaBridge",
                  planned: 1,
                  inTransit: 7,
                  delivered: 9,
                },
                {
                  carrier: "RailConnect",
                  planned: 2,
                  inTransit: 6,
                  delivered: 10,
                },
              ].map((row) => (
                <tr key={row.carrier} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 text-slate-800">{row.carrier}</td>
                  <td className="px-2 py-1.5 text-right text-slate-700">
                    {row.planned}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-700">
                    {row.inTransit}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-700">
                    {row.delivered}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Warehouse Inventory Snapshot
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Current capacity and critical stock levels.
              </p>
            </div>
            <Link
              href="/inventory"
              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              View Inventory
            </Link>
          </div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between">
              <span className="text-slate-700">WH-01 · Calgary</span>
              <span className="text-[11px] text-slate-500">64% capacity</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-700">WH-02 · Vancouver</span>
              <span className="text-[11px] text-amber-600">
                82% capacity · monitor
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-700">WH-03 · Toronto</span>
              <span className="text-[11px] text-emerald-600">
                48% capacity · stable
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

