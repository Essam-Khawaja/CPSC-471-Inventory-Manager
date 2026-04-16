import Link from "next/link";

// Shown to users whose account_status is not yet "active".
// They can sign in to Supabase but cannot access the main app.
export default function PendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-black">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
          Account Pending Approval
        </h1>
        <p className="mt-2 text-xs text-slate-600 dark:text-neutral-400">
          Your account has been created but is still waiting for an admin to
          approve it. Please check back later or contact your administrator.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
