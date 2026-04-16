import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// POST /api/register - Creates a public.users row for a newly registered user.
// The user starts with pending_registration status and STAFF role (role_id=2).
export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const pool = getPool();

    // Check if user already exists to avoid wasting sequence IDs
    const existing = await pool.query("SELECT user_id FROM users WHERE email = $1", [email.trim()]);
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ ok: true, userId: existing.rows[0].user_id });
    }

    // Manually set user_id to max+1 to avoid gaps from failed inserts
    const result = await pool.query(
      `
      INSERT INTO users (user_id, name, email, password, role_id, account_status)
      VALUES ((SELECT COALESCE(MAX(user_id), 0) + 1 FROM users), $1, $2, 'supabase-managed', 2, 'pending_registration')
      RETURNING user_id
      `,
      [name.trim(), email.trim()]
    );

    const userId = result.rows[0].user_id;

    // Keep the sequence in sync so future BIGSERIAL inserts don't conflict
    await pool.query("SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users))");

    // Also create the warehouse_staff specialization row
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
