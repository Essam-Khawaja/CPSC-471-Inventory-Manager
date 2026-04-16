"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  user_id: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "UNKNOWN";
  account_status: string;
};

export function UpdateUserPanel() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [promoteToAdmin, setPromoteToAdmin] = useState(false);

  async function loadUser() {
    setError("");
    setSuccess("");
    setUser(null);
    setPromoteToAdmin(false);

    const id = userId.trim();
    if (!id || !Number.isInteger(Number(id))) {
      setError("Enter a valid user ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load user.");
        return;
      }
      setUser(data as UserData);
      setEditName(data.name);
      setEditEmail(data.email);
    } catch {
      setError("Network error loading user.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          name: editName.trim() || undefined,
          email: editEmail.trim() || undefined,
          promote_to_admin: promoteToAdmin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update user.");
        return;
      }
      setUser(data.user as UserData);
      setEditName(data.user.name);
      setEditEmail(data.user.email);
      setPromoteToAdmin(false);
      setSuccess("User updated successfully.");
      router.refresh();
    } catch {
      setError("Network error updating user.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";
  const labelCls = "text-[11px] font-medium text-slate-700 dark:text-neutral-300";

  return (
    <div className="space-y-2 rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-400">
        Update User
      </h2>
      <p className="text-[11px] text-slate-500 dark:text-neutral-500">
        Enter a User ID to load their data, then edit fields below.
      </p>

      {/* Load user by ID */}
      <div className="mt-2 flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="update_user_id" className={labelCls}>
            User ID
          </label>
          <input
            id="update_user_id"
            type="number"
            min={1}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadUser()}
            className={inputCls + " w-28"}
          />
        </div>
        <button
          type="button"
          onClick={loadUser}
          disabled={loading}
          className="rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

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

      {/* Edit form - only shown once a user is loaded */}
      {user && (
        <form onSubmit={handleUpdate} className="mt-3 space-y-2 text-xs">
          <div className="rounded border border-slate-100 bg-slate-50 px-3 py-2 dark:border-neutral-800 dark:bg-black/40">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
              Loaded: #{user.user_id} | {user.role} | Status: {user.account_status}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit_name" className={labelCls}>
              Name
            </label>
            <input
              id="edit_name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit_email" className={labelCls}>
              Email
            </label>
            <input
              id="edit_email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          {user.role === "STAFF" && (
            <label className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={promoteToAdmin}
                onChange={(e) => setPromoteToAdmin(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-neutral-700"
              />
              Promote to Admin
            </label>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            {saving ? "Saving..." : "Update User"}
          </button>
        </form>
      )}
    </div>
  );
}
