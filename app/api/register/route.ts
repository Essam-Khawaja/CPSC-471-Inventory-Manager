import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase-server";

// POST /api/register - Creates a public.users row for a newly registered user.
// The user starts with pending_registration status and STAFF role (role_id=2).
// Requires a valid Supabase session whose email matches the request body.
export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser || authUser.email !== email.trim()) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const pool = getPool();

    const existing = await pool.query("SELECT user_id FROM users WHERE email = $1", [email.trim()]);
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ ok: true, userId: existing.rows[0].user_id });
    }

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password, role_id, account_status)
      VALUES ($1, $2, 'supabase-managed', 2, 'pending_registration')
      RETURNING user_id
      `,
      [name.trim(), email.trim()]
    );

    const userId = result.rows[0].user_id;

    await pool.query(
      `
      INSERT INTO warehouse_staff (user_id, job_title, shift)
      VALUES ($1, 'Warehouse Operator', 'Day')
      ON CONFLICT (user_id) DO NOTHING
      `,
      [userId]
    );

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Registration error:", message);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
