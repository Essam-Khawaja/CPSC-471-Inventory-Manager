import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/admin/user?id=<user_id> - fetch a single user's editable data */
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !Number.isInteger(Number(id))) {
    return NextResponse.json({ error: "Valid user ID required" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.account_status,
              CASE
                WHEN a.user_id IS NOT NULL THEN 'ADMIN'
                WHEN ws.user_id IS NOT NULL THEN 'STAFF'
                ELSE 'UNKNOWN'
              END AS role
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.user_id
       LEFT JOIN warehouse_staff ws ON ws.user_id = u.user_id
       WHERE u.user_id = $1
       LIMIT 1`,
      [Number(id)]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/admin/user error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

/** PATCH /api/admin/user - update a user's name, email, and/or promote to admin */
export async function PATCH(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = Number(body.user_id);
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const promoteToAdmin = body.promote_to_admin === true;

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Valid user ID required" }, { status: 400 });
  }

  try {
    const pool = getPool();

    const existing = await pool.query("SELECT user_id, email FROM users WHERE user_id = $1", [userId]);
    if ((existing.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name) {
      await pool.query("UPDATE users SET name = $1 WHERE user_id = $2", [name, userId]);
    }

    if (email) {
      const dup = await pool.query("SELECT user_id FROM users WHERE email = $1 AND user_id != $2", [email, userId]);
      if ((dup.rowCount ?? 0) > 0) {
        return NextResponse.json({ error: "Another user already has that email" }, { status: 409 });
      }
      await pool.query("UPDATE users SET email = $1 WHERE user_id = $2", [email, userId]);
    }

    if (promoteToAdmin) {
      const alreadyAdmin = await pool.query("SELECT 1 FROM admins WHERE user_id = $1", [userId]);
      if ((alreadyAdmin.rowCount ?? 0) > 0) {
        return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
      }

      await pool.query(
        `INSERT INTO admins (user_id, admin_level) VALUES ($1, 1) ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      await pool.query("DELETE FROM warehouse_staff WHERE user_id = $1", [userId]);
      await pool.query("UPDATE users SET role_id = 1 WHERE user_id = $1", [userId]);
    }

    const updated = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.account_status,
              CASE
                WHEN a.user_id IS NOT NULL THEN 'ADMIN'
                WHEN ws.user_id IS NOT NULL THEN 'STAFF'
                ELSE 'UNKNOWN'
              END AS role
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.user_id
       LEFT JOIN warehouse_staff ws ON ws.user_id = u.user_id
       WHERE u.user_id = $1
       LIMIT 1`,
      [userId]
    );

    return NextResponse.json({ ok: true, user: updated.rows[0] });
  } catch (err) {
    console.error("PATCH /api/admin/user error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
