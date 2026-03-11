import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createCargo(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const cargoType = String(formData.get("cargo_type") ?? "").trim();
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const warehouseIdRaw = String(formData.get("warehouse_id") ?? "").trim();
  const quantityRaw = String(formData.get("initial_quantity") ?? "").trim();

  if (!cargoType || !weightRaw) {
    return;
  }

  const weight = Number(weightRaw);
  if (!Number.isFinite(weight) || weight <= 0) {
    return;
  }

  const pool = getPool();

  let cargoId: number | null = null;
  const insertCargoRes = await pool.query(
    "INSERT INTO cargo_items (cargo_type, weight) VALUES ($1, $2) RETURNING cargo_id",
    [cargoType, weight]
  );
  cargoId = insertCargoRes.rows[0].cargo_id as number;

  const warehouseId = warehouseIdRaw ? Number(warehouseIdRaw) : null;
  const quantity = quantityRaw ? Number(quantityRaw) : null;

  if (
    cargoId &&
    warehouseId &&
    Number.isInteger(warehouseId) &&
    quantity !== null &&
    Number.isInteger(quantity) &&
    quantity >= 0
  ) {
    await pool.query(
      `
      INSERT INTO inventory_records (cargo_id, warehouse_id, quantity_stored)
      VALUES ($1, $2, $3)
      ON CONFLICT (cargo_id, warehouse_id) DO UPDATE
      SET quantity_stored = EXCLUDED.quantity_stored, last_updated = NOW()
      `,
      [cargoId, warehouseId, quantity]
    );
  }

  revalidatePath("/cargo");
}

export default async function CargoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT cargo_id, cargo_type, weight FROM cargo_items ORDER BY cargo_id"
  );
  const cargo = result.rows as {
    cargo_id: number;
    cargo_type: string;
    weight: number;
  }[];
  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
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
            </header>

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Create New Cargo Item
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Optionally seed an initial inventory record for a warehouse.
              </p>
              <form
                action={createCargo}
                className="mt-2 grid gap-2 text-xs md:grid-cols-4"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cargo_type"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Cargo Type
                  </label>
                  <input
                    id="cargo_type"
                    name="cargo_type"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="weight"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="warehouse_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Initial Warehouse ID (optional)
                  </label>
                  <input
                    id="warehouse_id"
                    name="warehouse_id"
                    type="number"
                    min={1}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="initial_quantity"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Initial Quantity (optional)
                  </label>
                  <input
                    id="initial_quantity"
                    name="initial_quantity"
                    type="number"
                    min={0}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-4">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Cargo Item
                  </button>
                </div>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cargo ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Cargo Type
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Weight (kg)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargo.map((item) => (
                    <tr key={item.cargo_id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">
                        {item.cargo_id}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {item.cargo_type}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {item.weight}
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

