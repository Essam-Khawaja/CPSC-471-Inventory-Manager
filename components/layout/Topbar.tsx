"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Menu } from "lucide-react";

type TopbarProps = {
  onMenuClick: () => void;
};

// Top bar showing app title, current user email, sign-out, and mobile menu button
export function Topbar({ onMenuClick }: TopbarProps) {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  // Fetch the current user's email from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      setEmail(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setEmail(data.user?.email ?? null);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sign out via Supabase and redirect to login
  async function handleSignOut() {
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      router.push("/login");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-500">
            Freight Cargo Control
          </div>
          <div className="text-sm font-medium text-slate-900 dark:text-neutral-100">
            Operational Overview
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-neutral-300 sm:gap-4">
        {email ? (
          <>
            <span className="hidden font-medium sm:inline">{email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
