import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET /api/db/health - Simple health check to verify database connectivity.
// Returns the current timestamp and Postgres version on success.
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, error: "Missing DATABASE_URL env var." },
      { status: 500 }
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query("SELECT now() AS now, version() AS version");

    return NextResponse.json({
      ok: true,
      now: result.rows[0]?.now ?? null,
      version: result.rows[0]?.version ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    return NextResponse.json(
      { ok: false, error: "Database query failed.", details: message },
      { status: 500 }
    );
  }
}
