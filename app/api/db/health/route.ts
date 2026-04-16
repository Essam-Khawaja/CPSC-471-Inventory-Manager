import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const databaseUrlPresent = Boolean(process.env.DATABASE_URL);

  if (!databaseUrlPresent) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing DATABASE_URL env var.",
      },
      { status: 500 }
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      "select now() as now, version() as version"
    );

    return NextResponse.json({
      ok: true,
      now: result.rows[0]?.now ?? null,
      version: result.rows[0]?.version ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DB error";
    return NextResponse.json(
      {
        ok: false,
        error: "Database query failed.",
        details: message,
      },
      { status: 500 }
    );
  }
}

