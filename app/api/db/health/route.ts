import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/db/health - Admin-only health check to verify database connectivity.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, error: "Missing DATABASE_URL env var." },
      { status: 500 }
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query("SELECT now() AS now");

    return NextResponse.json({
      ok: true,
      now: result.rows[0]?.now ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    return NextResponse.json(
      { ok: false, error: "Database query failed.", details: message },
      { status: 500 }
    );
  }
}
