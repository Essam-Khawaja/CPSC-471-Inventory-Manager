import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type RoleKind = "ADMIN" | "STAFF";

async function createUser(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toUpperCase() as RoleKind;

  if (!name || !email || (role !== "ADMIN" && role !== "STAFF")) {
    return;
  }

  const pool = getPool();
  // role_id: 1 = admin, 2 = staff (convention only used here)
  const roleId = role === "ADMIN" ? 1 : 2;

  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role_id)
    VALUES ($1, $2, 'dev-only', $3)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          role_id = EXCLUDED.role_id
    RETURNING user_id
    `,
    [name, email, roleId]
  );

  const userId = result.rows[0].user_id as number;

  if (role === "ADMIN") {
    await pool.query(
      `
      INSERT INTO admins (user_id, admin_level)
      VALUES ($1, 1)
      ON CONFLICT (user_id) DO UPDATE SET admin_level = EXCLUDED.admin_level
      `,
      [userId]
    );
  } else if (role === "STAFF") {
    await pool.query(
      `
      INSERT INTO warehouse_staff (user_id, job_title, shift)
      VALUES ($1, 'Warehouse Operator', 'Day')
      ON CONFLICT (user_id) DO UPDATE
        SET job_title = EXCLUDED.job_title,
            shift = EXCLUDED.shift
      `,
      [userId]
    );
  }

  revalidatePath("/users");
}

async function assignAdminWarehouse(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    redirect("/login");
  }

  const adminUserIdRaw = String(formData.get("admin_user_id") ?? "").trim();
  const warehouseIdRaw = String(formData.get("warehouse_id") ?? "").trim();

  const adminUserId = Number(adminUserIdRaw);
  const warehouseId = Number(warehouseIdRaw);

  if (!Number.isInteger(adminUserId) || !Number.isInteger(warehouseId)) {
    return;
  }

  const pool = getPool();
  await pool.query(
    `
    INSERT INTO manages (admin_user_id, warehouse_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [adminUserId, warehouseId]
  );

  revalidatePath("/users");
}

export default async function UsersPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (current.role !== "ADMIN") {
    redirect("/");
  }

  const pool = getPool();

  const usersResult = await pool.query(
    `
    SELECT
      u.user_id,
      u.name,
      u.email,
      CASE
        WHEN a.user_id IS NOT NULL THEN 'ADMIN'
        WHEN ws.user_id IS NOT NULL THEN 'STAFF'
        ELSE 'UNKNOWN'
      END AS role
    FROM users u
    LEFT JOIN admins a ON a.user_id = u.user_id
    LEFT JOIN warehouse_staff ws ON ws.user_id = u.user_id
    ORDER BY u.user_id
    `
  );

  const warehousesResult = await pool.query(
    "SELECT warehouse_id, name FROM warehouses ORDER BY warehouse_id"
  );

  const managesResult = await pool.query(
    `
    SELECT
      m.admin_user_id,
      w.warehouse_id,
      w.name AS warehouse_name
    FROM manages m
    JOIN warehouses w ON w.warehouse_id = m.warehouse_id
    ORDER BY m.admin_user_id, w.warehouse_id
    `
  );

  const users = usersResult.rows as {
    user_id: number;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF" | "UNKNOWN";
  }[];

  const warehouses = warehousesResult.rows as {
    warehouse_id: number;
    name: string;
  }[];

  const manages = managesResult.rows as {
    admin_user_id: number;
    warehouse_id: number;
    warehouse_name: string;
  }[];

  return (
    <div className="flex min-h-screen">
      <Sidebar role={current.role} />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-slate-50 px-6 py-4">
          <section className="space-y-4">
            <header>
              <h1 className="text-base font-semibold text-slate-900">
                Users & Roles
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                Manage application users, their roles, and warehouse
                assignments.
              </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Create / Update User
                </h2>
                <p className="text-[11px] text-slate-500">
                  Email must match an existing Supabase Auth user for login.
                </p>
                <form
                  action={createUser}
                  className="mt-2 space-y-2 text-xs"
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="name"
                      className="text-[11px] font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="email"
                      className="text-[11px] font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="role"
                      className="text-[11px] font-medium text-slate-700"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select role…</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Warehouse Staff</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="mt-2 rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save User
                  </button>
                </form>
              </div>

              <div className="space-y-2 rounded border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Assign Admin to Warehouse
                </h2>
                <form
                  action={assignAdminWarehouse}
                  className="mt-2 grid gap-2 text-xs md:grid-cols-2"
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="admin_user_id"
                      className="text-[11px] font-medium text-slate-700"
                    >
                      Admin User ID
                    </label>
                    <input
                      id="admin_user_id"
                      name="admin_user_id"
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
                      Warehouse
                    </label>
                    <select
                      id="warehouse_id"
                      name="warehouse_id"
                      required
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select warehouse…</option>
                      {warehouses.map((w) => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>
                          {w.warehouse_id} – {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 md:col-span-2">
                    <button
                      type="submit"
                      className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Assign
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      User ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Managed Warehouses (if admin)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const managed = manages.filter(
                      (m) => m.admin_user_id === u.user_id
                    );
                    return (
                      <tr key={u.user_id} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-800">
                          {u.user_id}
                        </td>
                        <td className="px-3 py-2 text-slate-800">{u.name}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {u.email}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{u.role}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {managed.length === 0
                            ? "-"
                            : managed
                                .map(
                                  (m) =>
                                    `${m.warehouse_id} – ${m.warehouse_name}`
                                )
                                .join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

