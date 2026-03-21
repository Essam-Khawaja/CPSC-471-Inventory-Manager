"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export function Topbar() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Freight Cargo Control
          </div>
          <div className="text-sm font-medium text-slate-900">
            Operational Overview
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-700">
        {email ? (
          <>
            <div className="flex flex-col items-end">
              <span className="font-medium">{email}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}


