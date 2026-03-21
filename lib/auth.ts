import { getPool } from "./db";
import { createSupabaseServer } from "./supabase-server";

export type CurrentUser = {
  userId: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "UNKNOWN";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Avoid crashing static/prerender builds when env vars aren't present.
    return null;
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.name,
      CASE
        WHEN a.user_id IS NOT NULL THEN 'ADMIN'
        WHEN ws.user_id IS NOT NULL THEN 'STAFF'
        ELSE 'UNKNOWN'
      END AS role
    FROM users u
    LEFT JOIN admins a ON a.user_id = u.user_id
    LEFT JOIN warehouse_staff ws ON ws.user_id = u.user_id
    WHERE u.email = $1
    LIMIT 1
    `,
    [user.email]
  );

  if (result.rowCount === 0) {
    return {
      userId: -1,
      name: user.email,
      email: user.email,
      role: "UNKNOWN",
    };
  }

  const row = result.rows[0] as {
    user_id: number;
    name: string;
    role: "ADMIN" | "STAFF" | "UNKNOWN";
  };

  return {
    userId: row.user_id,
    name: row.name,
    email: user.email,
    role: row.role,
  };
}


