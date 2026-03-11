"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-base font-semibold text-slate-900">
          Sign in to Freight Control
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Use your Supabase-authenticated Admin or Warehouse Staff account.
        </p>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-[11px] font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-[11px] font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

