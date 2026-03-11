import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServer() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // For RSC we don't need to set/remove cookies here
      set() {},
      remove() {},
    },
  });
}

