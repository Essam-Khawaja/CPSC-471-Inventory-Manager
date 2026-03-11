import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function adjustInventory(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const cargoIdRaw = String(formData.get("cargo_id") ?? "").trim();
  const warehouseIdRaw = String(formData.get("warehouse_id") ?? "").trim();
  const deltaRaw = String(formData.get("delta_quantity") ?? "").trim();

  const cargoId = Number(cargoIdRaw);
  const warehouseId = Number(warehouseIdRaw);
  const delta = Number(deltaRaw);

  if (
    !Number.isInteger(cargoId) ||
    !Number.isInteger(warehouseId) ||
    !Number.isInteger(delta)
  ) {
    redirect(
      `/inventory?error=${encodeURIComponent(
        "Invalid IDs or quantity. Please enter whole numbers."
      )}`
    );
  }

  const pool = getPool();
  try {
    await pool.query("SELECT fn_update_inventory($1, $2, $3, $4)", [
      cargoId,
      warehouseId,
      delta,
      user.userId,
    ]);
  } catch (error) {
    console.error("Error adjusting inventory", error);
    redirect(
      `/inventory?error=${encodeURIComponent(
        "Inventory adjustment failed. Ensure the record exists and quantity does not go negative."
      )}`
    );
  }

  revalidatePath("/inventory");
  redirect("/inventory");
}

async function moveCargoToContainer(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const cargoIdRaw = String(formData.get("cargo_id") ?? "").trim();
  const containerIdRaw = String(formData.get("container_id") ?? "").trim();

  const cargoId = Number(cargoIdRaw);
  const containerId = Number(containerIdRaw);

  if (!Number.isInteger(cargoId) || !Number.isInteger(containerId)) {
    redirect(
      `/inventory?error=${encodeURIComponent(
        "Invalid cargo or container ID. Please enter whole numbers."
      )}`
    );
  }

  const pool = getPool();

  try {
    const cargoRes = await pool.query(
      "SELECT weight FROM cargo_items WHERE cargo_id = $1",
      [cargoId]
    );
    const containerRes = await pool.query(
      "SELECT max_capacity FROM containers WHERE container_id = $1",
      [containerId]
    );

    if (cargoRes.rowCount === 0 || containerRes.rowCount === 0) {
      redirect(
        `/inventory?error=${encodeURIComponent(
          "Cargo or container not found. Check the IDs and try again."
        )}`
      );
    }

    const cargoWeight = Number(cargoRes.rows[0].weight);
    const maxCapacity = Number(containerRes.rows[0].max_capacity);

    const currentRes = await pool.query(
      `
      SELECT COALESCE(SUM(ci.weight), 0) AS current_weight
      FROM container_cargo cc
      JOIN cargo_items ci ON ci.cargo_id = cc.cargo_id
      WHERE cc.container_id = $1
      `,
      [containerId]
    );
    const currentWeight = Number(currentRes.rows[0].current_weight);
    const newTotal = currentWeight + cargoWeight;

    if (!Number.isFinite(newTotal) || newTotal > maxCapacity) {
      console.error("Capacity exceeded for container", {
        containerId,
        currentWeight,
        cargoWeight,
        maxCapacity,
      });
      redirect(
        `/inventory?error=${encodeURIComponent(
          "Capacity exceeded for container. Reduce cargo weight or choose another container."
        )}`
      );
    }

    await pool.query(
      "INSERT INTO container_cargo (cargo_id, container_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [cargoId, containerId]
    );
  } catch (error) {
    console.error("Error moving cargo to container", error);
    redirect(
      `/inventory?error=${encodeURIComponent(
        "Move to container failed due to a database error."
      )}`
    );
  }

  revalidatePath("/inventory");
}

type InventoryPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const params = await searchParams;
  const error = params.error;
  const pool = getPool();
  const result = await pool.query(
    "SELECT cargo_id, warehouse_id, quantity_stored, last_updated FROM inventory_records ORDER BY warehouse_id, cargo_id"
  );
  const inventory = result.rows as {
    cargo_id: number;
    warehouse_id: number;
    quantity_stored: number;
    last_updated: Date;
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
                  Inventory Records
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  View and maintain inventory records per warehouse and cargo
                  item.
                </p>
              </div>
            </header>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Adjust Inventory Quantity
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Provide a positive or negative quantity change for a specific
                cargo and warehouse.
              </p>
              <form
                action={adjustInventory}
                className="mt-2 grid gap-2 text-xs md:grid-cols-4"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cargo_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Cargo ID
                  </label>
                  <input
                    id="cargo_id"
                    name="cargo_id"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="warehouse_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Warehouse ID
                  </label>
                  <input
                    id="warehouse_id"
                    name="warehouse_id"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="delta_quantity"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Delta Quantity
                  </label>
                  <input
                    id="delta_quantity"
                    name="delta_quantity"
                    type="number"
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-4">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded border border-slate-200 bg-white p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Move Cargo to Container
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Link a cargo item to a container. Basic capacity checks are
                enforced based on container max capacity and cargo weights.
              </p>
              <form
                action={moveCargoToContainer}
                className="mt-2 grid gap-2 text-xs md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="move_cargo_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Cargo ID
                  </label>
                  <input
                    id="move_cargo_id"
                    name="cargo_id"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="container_id"
                    className="text-[11px] font-medium text-slate-700"
                  >
                    Container ID
                  </label>
                  <input
                    id="container_id"
                    name="container_id"
                    type="number"
                    min={1}
                    required
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="mt-2 md:col-span-3">
                  <button
                    type="submit"
                    className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Move Cargo
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
                      Warehouse ID
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Quantity Stored
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((row) => (
                    <tr
                      key={`${row.warehouse_id}-${row.cargo_id}`}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {row.cargo_id}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {row.warehouse_id}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {row.quantity_stored}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {new Date(row.last_updated).toLocaleString()}
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

