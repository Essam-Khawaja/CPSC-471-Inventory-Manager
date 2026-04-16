import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Approve a pending user registration (sets account_status to 'active')
async function approveUser(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const userId = Number(formData.get("user_id"));
  if (!Number.isInteger(userId)) return;

  const pool = getPool();
  await pool.query(
    "UPDATE users SET account_status = 'active' WHERE user_id = $1",
    [userId]
  );
  revalidatePath("/admin/approvals/users");
}

// Reject a pending user registration
async function rejectUser(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const userId = Number(formData.get("user_id"));
  if (!Number.isInteger(userId)) return;

  const pool = getPool();
  await pool.query(
    "UPDATE users SET account_status = 'rejected' WHERE user_id = $1",
    [userId]
  );
  revalidatePath("/admin/approvals/users");
}

// Admin page listing all users with pending_registration status for approval
export default async function ApproveUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const pool = getPool();
  const result = await pool.query(
    `SELECT user_id, name, email, account_status
     FROM users
     WHERE account_status = 'pending_registration'
     ORDER BY user_id`
  );
  const pendingUsers = result.rows as {
    user_id: number;
    name: string;
    email: string;
    account_status: string;
  }[];

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            Approve New Users
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">
            Users who registered are listed here for approval. Approved users
            get staff access by default.
          </p>
        </header>

        {pendingUsers.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            No pending registrations.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Email</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.user_id} className="border-b border-slate-100 dark:border-neutral-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{u.user_id}</td>
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{u.name}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{u.email}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <form action={approveUser} className="inline">
                          <input type="hidden" name="user_id" value={u.user_id} />
                          <button
                            type="submit"
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={rejectUser} className="inline">
                          <input type="hidden" name="user_id" value={u.user_id} />
                          <button
                            type="submit"
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}
