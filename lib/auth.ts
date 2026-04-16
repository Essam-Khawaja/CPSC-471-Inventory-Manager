import { getPool } from "./db";
import { createSupabaseServer } from "./supabase-server";

export type CurrentUser = {
  userId: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "UNKNOWN";
  accountStatus: string;
  warehouseIds: number[];
};

// Resolves the currently signed-in Supabase user to an application user.
// Joins public.users with admins/warehouse_staff to determine role.
// Also fetches the warehouse IDs the user is assigned to (via manages or warehouse_staff).
// Returns null if not signed in or Supabase env vars are missing.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
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
      u.account_status,
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
      accountStatus: "none",
      warehouseIds: [],
    };
  }

  const row = result.rows[0] as {
    user_id: number;
    name: string;
    role: "ADMIN" | "STAFF" | "UNKNOWN";
    account_status: string;
  };

  let warehouseIds: number[] = [];
  if (row.role === "ADMIN") {
    const whRes = await pool.query(
      "SELECT warehouse_id FROM manages WHERE admin_user_id = $1",
      [row.user_id]
    );
    warehouseIds = whRes.rows.map((r: { warehouse_id: number }) => r.warehouse_id);
  } else if (row.role === "STAFF") {
    const whRes = await pool.query(
      "SELECT warehouse_id FROM warehouse_staff WHERE user_id = $1 AND warehouse_id IS NOT NULL",
      [row.user_id]
    );
    warehouseIds = whRes.rows.map((r: { warehouse_id: number }) => r.warehouse_id);
  }

  return {
    userId: row.user_id,
    name: row.name,
    email: user.email,
    role: row.role,
    accountStatus: row.account_status,
    warehouseIds,
  };
}
