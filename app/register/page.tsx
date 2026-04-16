"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

// Registration page: creates a Supabase auth user and a public.users row
// with pending_registration status. New users default to STAFF role.
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handles form submission: signs up via Supabase, then creates DB user row
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setError("Supabase is not configured. Check environment variables.");
      setLoading(false);
      return;
    }

    // Create the auth user in Supabase
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Call our server endpoint to create the public.users row
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error ?? "Registration failed.");
      return;
    }

    setSuccess(true);
  }

  // After successful registration, show a confirmation message
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-black">
        <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            Registration Submitted
          </h1>
          <p className="mt-2 text-xs text-slate-600 dark:text-neutral-400">
            Your account is pending admin approval. You will be able to sign in
            once an admin activates your account.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-black">
      <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
          Register for Freight Control
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-neutral-400">
          Create an account. You will start as staff pending admin approval.
        </p>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-[11px] font-medium text-slate-700 dark:text-neutral-300">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-[11px] font-medium text-slate-700 dark:text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-[11px] font-medium text-slate-700 dark:text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:border-neutral-700 dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-600 hover:underline dark:text-sky-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
