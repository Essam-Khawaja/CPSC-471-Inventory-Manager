import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Creates a Supabase client for server-side use (RSC, server actions).
// Wires cookie access for session reading. Write ops are no-ops in RSC.
export async function createSupabaseServer() {
  const cookieStore = await cookies();
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
      set() {},
      remove() {},
    },
  });
}
