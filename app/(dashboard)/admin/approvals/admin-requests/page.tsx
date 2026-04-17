import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Approve a staff member's request to become admin
async function approveRequest(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const requestId = Number(formData.get("request_id"));
  if (!Number.isInteger(requestId)) redirect("/admin/approvals/admin-requests");

  const pool = getPool();

  const reqRow = await pool.query(
    `SELECT user_id FROM admin_access_requests WHERE request_id = $1 AND status = 'pending'`,
    [requestId]
  );
  if ((reqRow.rowCount ?? 0) === 0) redirect("/admin/approvals/admin-requests");
  const userId = reqRow.rows[0].user_id as number;

  // Mark the request as approved
  await pool.query(
    `UPDATE admin_access_requests
     SET status = 'approved', resolved_at = NOW(), resolved_by_user_id = $1
     WHERE request_id = $2`,
    [current.userId, requestId]
  );

  // Promote: insert into admins, remove from warehouse_staff, update role_id
  await pool.query(
    `INSERT INTO admins (user_id, admin_level) VALUES ($1, 1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  await pool.query("DELETE FROM warehouse_staff WHERE user_id = $1", [userId]);
  await pool.query("UPDATE users SET role_id = 1 WHERE user_id = $1", [userId]);

  revalidatePath("/admin/approvals/admin-requests");
}

// Reject a staff member's admin access request
async function rejectRequest(formData: FormData) {
  "use server";
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") redirect("/login");

  const requestId = Number(formData.get("request_id"));
  if (!Number.isInteger(requestId)) redirect("/admin/approvals/admin-requests");

  const pool = getPool();
  await pool.query(
    `UPDATE admin_access_requests
     SET status = 'rejected', resolved_at = NOW(), resolved_by_user_id = $1
     WHERE request_id = $2`,
    [current.userId, requestId]
  );
  revalidatePath("/admin/approvals/admin-requests");
}

// Admin page showing pending staff-to-admin promotion requests
export default async function AdminRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const pool = getPool();
  const result = await pool.query(
    `SELECT r.request_id, r.user_id, r.reason, r.requested_at, u.name, u.email
     FROM admin_access_requests r
     JOIN users u ON u.user_id = r.user_id
     WHERE r.status = 'pending'
     ORDER BY r.requested_at`
  );
  const requests = result.rows as {
    request_id: number;
    user_id: number;
    reason: string;
    requested_at: Date;
    name: string;
    email: string;
  }[];

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            Admin Access Requests
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">
            Staff members requesting promotion to admin. Approving removes
            their warehouse_staff row and grants admin privileges.
          </p>
        </header>

        {requests.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            No pending admin access requests.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Reason</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Date</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id} className="border-b border-slate-100 dark:border-neutral-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{r.name}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{r.email}</td>
                    <td className="max-w-[400px] whitespace-pre-wrap break-words px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {r.reason}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {new Date(r.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <form action={approveRequest} className="inline">
                          <input type="hidden" name="request_id" value={r.request_id} />
                          <button
                            type="submit"
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={rejectRequest} className="inline">
                          <input type="hidden" name="request_id" value={r.request_id} />
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
