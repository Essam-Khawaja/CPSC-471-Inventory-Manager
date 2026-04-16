import { createBrowserClient } from "@supabase/ssr";

// Creates a Supabase client for browser-side usage (login, sign-out, etc.).
// Returns null when env vars are not configured to avoid build errors.
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createBrowserClient(url, key);
}
