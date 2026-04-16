import { CharLimitTextarea } from "@/components/ui/CharLimitTextarea";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Submit a new admin access request with a reason
async function submitRequest(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "STAFF") redirect("/");

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!reason) return;

  const pool = getPool();

  // Prevent duplicate pending requests from the same user
  const existing = await pool.query(
    `SELECT 1 FROM admin_access_requests
     WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
    [user.userId]
  );
  if ((existing.rowCount ?? 0) > 0) {
    redirect("/staff/request-admin?error=already_pending");
  }

  await pool.query(
    `INSERT INTO admin_access_requests (user_id, reason)
     VALUES ($1, $2)`,
    [user.userId, reason]
  );

  revalidatePath("/staff/request-admin");
  redirect("/staff/request-admin?success=1");
}

type RequestAdminPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

// Staff page to request admin access by providing a reason
export default async function RequestAdminPage({ searchParams }: RequestAdminPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STAFF") redirect("/");

  const params = await searchParams;

  const pool = getPool();
  const existing = await pool.query(
    `SELECT request_id, status, requested_at
     FROM admin_access_requests
     WHERE user_id = $1
     ORDER BY requested_at DESC`,
    [user.userId]
  );
  const myRequests = existing.rows as {
    request_id: number;
    status: string;
    requested_at: Date;
  }[];

  const hasPending = myRequests.some((r) => r.status === "pending");

  return (
    <section className="space-y-3">
        <header>
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            Request Admin Access
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">
            Submit a request to be promoted to admin. An admin will review your
            request.
          </p>
        </header>

        {params.success && (
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
            Your request has been submitted successfully.
          </div>
        )}

        {params.error === "already_pending" && (
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            You already have a pending request.
          </div>
        )}

        {!hasPending && (
          <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">
              New Request
            </h2>
            <form action={submitRequest} className="mt-2 space-y-2 text-xs">
              <div className="flex flex-col gap-1">
                <label htmlFor="reason" className="text-[11px] font-medium text-slate-700 dark:text-neutral-300">
                  Reason for requesting admin access
                </label>
                <CharLimitTextarea id="reason" name="reason" maxLength={1000} rows={3} required />
              </div>
              <button
                type="submit"
                className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                Submit Request
              </button>
            </form>
          </div>
        )}

        {/* Show history of user's requests */}
        {myRequests.length > 0 && (
          <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-neutral-800 dark:text-neutral-400">
              Your Requests
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-neutral-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r) => (
                  <tr key={r.request_id} className="border-b border-slate-100 dark:border-neutral-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-neutral-200">{r.request_id}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{r.status}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">
                      {new Date(r.requested_at).toLocaleDateString()}
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
