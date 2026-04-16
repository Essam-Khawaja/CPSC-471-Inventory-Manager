import { UpdateUserPanel } from "@/components/users/UpdateUserPanel";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** Server action: create a brand-new user (Supabase Auth + public.users + specialization row) */
async function createUser(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toUpperCase() as
    | "ADMIN"
    | "STAFF";

  if (!name || !email || (role !== "ADMIN" && role !== "STAFF")) return;

  const pool = getPool();

  const existing = await pool.query(
    "SELECT user_id FROM users WHERE email = $1",
    [email]
  );
  if ((existing.rowCount ?? 0) > 0) {
    redirect(
      `/users?error=${encodeURIComponent("A user with this email already exists in the database.")}`
    );
  }

  // Create the Supabase Auth user with default password "temp".
  // Uses signUp with the public anon key (same approach as the registration page).
  let authCreated = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: "dev-only",
      });

      if (signUpError) {
        if (signUpError.message?.includes("already been registered")) {
          // Auth user already exists; still allow creating the DB row
        } else {
          redirect(
            `/users?error=${encodeURIComponent("Supabase Auth error: " + signUpError.message)}`
          );
        }
      } else {
        authCreated = true;
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      redirect(
        `/users?error=${encodeURIComponent("Could not reach Supabase Auth. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")}`
      );
    }
  }

  const roleId = role === "ADMIN" ? 1 : 2;

  const result = await pool.query(
    `INSERT INTO users (user_id, name, email, password, role_id, account_status)
     VALUES ((SELECT COALESCE(MAX(user_id), 0) + 1 FROM users), $1, $2, 'supabase-managed', $3, 'active')
     RETURNING user_id`,
    [name, email, roleId]
  );
  const userId = result.rows[0].user_id as number;

  await pool.query(
    "SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users))"
  );

  if (role === "ADMIN") {
    await pool.query(
      `INSERT INTO admins (user_id, admin_level) VALUES ($1, 1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  } else {
    await pool.query(
      `INSERT INTO warehouse_staff (user_id, job_title, shift)
       VALUES ($1, 'Warehouse Operator', 'Day')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  }

  revalidatePath("/users");

  const msg = authCreated
    ? `User "${name}" created (ID ${userId}). Default password is "dev-only"; notify the user to change it after first login.`
    : `User "${name}" created (ID ${userId}). Auth account already existed for this email; existing password still applies.`;

  redirect(`/users?success=${encodeURIComponent(msg)}`);
}

async function assignUserWarehouse(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const targetUserId = Number(
    String(formData.get("target_user_id") ?? "").trim()
  );
  const warehouseId = Number(
    String(formData.get("warehouse_id") ?? "").trim()
  );
  if (!Number.isInteger(targetUserId) || targetUserId <= 0 || !Number.isInteger(warehouseId) || warehouseId <= 0) {
    redirect(`/users?error=${encodeURIComponent("Invalid user ID or warehouse ID.")}`);
  }

  const pool = getPool();

  const userCheck = await pool.query(
    `SELECT
       CASE WHEN a.user_id IS NOT NULL THEN 'ADMIN'
            WHEN ws.user_id IS NOT NULL THEN 'STAFF'
            ELSE 'UNKNOWN' END AS role
     FROM users u
     LEFT JOIN admins a ON a.user_id = u.user_id
     LEFT JOIN warehouse_staff ws ON ws.user_id = u.user_id
     WHERE u.user_id = $1`,
    [targetUserId]
  );
  if ((userCheck.rowCount ?? 0) === 0) {
    redirect(`/users?error=${encodeURIComponent("User " + targetUserId + " does not exist.")}`);
  }

  const role = userCheck.rows[0].role;
  if (role === "ADMIN") {
    await pool.query(
      `INSERT INTO manages (admin_user_id, warehouse_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [targetUserId, warehouseId]
    );
  } else if (role === "STAFF") {
    await pool.query(
      `UPDATE warehouse_staff SET warehouse_id = $1 WHERE user_id = $2`,
      [warehouseId, targetUserId]
    );
  } else {
    redirect(`/users?error=${encodeURIComponent("User " + targetUserId + " has no role assigned (not admin or staff).")}`);
  }

  revalidatePath("/users");
  redirect(`/users?success=${encodeURIComponent(`User ${targetUserId} (${role}) assigned to warehouse ${warehouseId}.`)}`);
}

async function demoteUser(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const userId = Number(String(formData.get("user_id") ?? "").trim());
  const demotionKey = String(formData.get("demotion_key") ?? "").trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect(`/users?error=${encodeURIComponent("Invalid user ID.")}`);
  }

  if (userId === current.userId) {
    redirect(
      `/users?error=${encodeURIComponent("You cannot demote yourself.")}`
    );
  }

  const expectedKey = process.env.DEMOTION_KEY ?? "cpsc471";
  if (demotionKey !== expectedKey) {
    redirect(
      `/users?error=${encodeURIComponent("Invalid demotion key.")}`
    );
  }

  const pool = getPool();

  const check = await pool.query("SELECT 1 FROM admins WHERE user_id = $1", [
    userId,
  ]);
  if ((check.rowCount ?? 0) === 0) {
    redirect(
      `/users?error=${encodeURIComponent("User " + userId + " is not an admin. Cannot demote a non-admin.")}`
    );
  }

  await pool.query("DELETE FROM manages WHERE admin_user_id = $1", [userId]);
  await pool.query("DELETE FROM admins WHERE user_id = $1", [userId]);
  await pool.query(
    `INSERT INTO warehouse_staff (user_id, job_title, shift)
     VALUES ($1, 'Warehouse Operator', 'Day')
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  await pool.query("UPDATE users SET role_id = 2 WHERE user_id = $1", [
    userId,
  ]);

  revalidatePath("/users");
  redirect(`/users?success=${encodeURIComponent(`User ${userId} has been demoted to staff.`)}`);
}

type UsersPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const error = (params.error ?? "").trim();
  const success = (params.success ?? "").trim();

  const pool = getPool();

  const usersResult = await pool.query(
    `SELECT u.user_id, u.name, u.email, u.account_status,
            CASE
              WHEN a.user_id IS NOT NULL THEN 'ADMIN'
              WHEN ws.user_id IS NOT NULL THEN 'STAFF'
              ELSE 'UNKNOWN'
            END AS role
     FROM users u
     LEFT JOIN admins a ON a.user_id = u.user_id
     LEFT JOIN warehouse_staff ws ON ws.user_id = u.user_id
     ORDER BY u.user_id`
  );

  const warehousesResult = await pool.query(
    "SELECT warehouse_id, name FROM warehouses ORDER BY warehouse_id"
  );

  const managesResult = await pool.query(
    `SELECT m.admin_user_id, w.warehouse_id, w.name AS warehouse_name
     FROM manages m
     JOIN warehouses w ON w.warehouse_id = m.warehouse_id
     ORDER BY m.admin_user_id, w.warehouse_id`
  );

  const staffWarehouseResult = await pool.query(
    `SELECT ws.user_id, w.warehouse_id, w.name AS warehouse_name
     FROM warehouse_staff ws
     JOIN warehouses w ON w.warehouse_id = ws.warehouse_id
     WHERE ws.warehouse_id IS NOT NULL`
  );

  const users = usersResult.rows as {
    user_id: number;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF" | "UNKNOWN";
    account_status: string;
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
  const staffWarehouses = staffWarehouseResult.rows as {
    user_id: number;
    warehouse_id: number;
    warehouse_name: string;
  }[];

  const inputCls =
    "rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";
  const labelCls =
    "text-[11px] font-medium text-slate-700 dark:text-neutral-300";

  return (
    <section className="space-y-4">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            Users &amp; Roles
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">
            Manage application users, their roles, and warehouse assignments.
          </p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Create New User */}
        <div className="space-y-2 rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">
            Create New User
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500">
            Creates a Supabase Auth account and a database user in one step.
            Default password is <strong>&quot;dev-only&quot;</strong>; the user
            must change it after first login.
          </p>
          <form action={createUser} className="mt-2 space-y-2 text-xs">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className={labelCls}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className={labelCls}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="role" className={labelCls}>
                  Role
                </label>
                <select id="role" name="role" required className={inputCls}>
                  <option value="">Select role...</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Warehouse Staff</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
            >
              Create User
            </button>
          </form>
        </div>

        {/* Update User */}
        <UpdateUserPanel />

        {/* Assign to Warehouse + Demotion */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">
              Assign User to Warehouse
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-neutral-500">
              Admins get added to the manages table. Staff get their warehouse updated.
            </p>
            <form
              action={assignUserWarehouse}
              className="mt-2 grid gap-2 text-xs sm:grid-cols-2"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="target_user_id" className={labelCls}>
                  User ID
                </label>
                <input
                  id="target_user_id"
                  name="target_user_id"
                  type="number"
                  min={1}
                  required
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="warehouse_id" className={labelCls}>
                  Warehouse
                </label>
                <select
                  id="warehouse_id"
                  name="warehouse_id"
                  required
                  className={inputCls}
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.warehouse_id} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 sm:col-span-2">
                <button
                  type="submit"
                  className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-2 rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">
              Demote Admin to Staff
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-neutral-500">
              Requires demotion key for confirmation.
            </p>
            <form
              action={demoteUser}
              className="mt-2 grid gap-2 text-xs sm:grid-cols-2"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="demote_user_id" className={labelCls}>
                  User ID to Demote
                </label>
                <input
                  id="demote_user_id"
                  name="user_id"
                  type="number"
                  min={1}
                  required
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="demotion_key" className={labelCls}>
                  Demotion Key
                </label>
                <input
                  id="demotion_key"
                  name="demotion_key"
                  type="password"
                  required
                  autoComplete="off"
                  className={inputCls}
                />
              </div>
              <div className="mt-2 sm:col-span-2">
                <button
                  type="submit"
                  className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  Demote
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Users table */}
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">
                  ID
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">
                  Role
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">
                  Assigned Warehouses
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const managed = manages.filter(
                  (m) => m.admin_user_id === u.user_id
                );
                const staffWh = staffWarehouses.filter(
                  (sw) => sw.user_id === u.user_id
                );
                const allAssignments = u.role === "ADMIN"
                  ? managed.map((m) => `${m.warehouse_id} - ${m.warehouse_name}`)
                  : staffWh.map((sw) => `${sw.warehouse_id} - ${sw.warehouse_name}`);
                return (
                  <tr
                    key={u.user_id}
                    className="border-b border-slate-100 dark:border-neutral-800"
                  >
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">
                      {u.user_id}
                    </td>
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">
                      {u.name}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {u.email}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {u.role}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {u.account_status}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {allAssignments.length === 0
                        ? "-"
                        : allAssignments.join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    </section>
  );
}
