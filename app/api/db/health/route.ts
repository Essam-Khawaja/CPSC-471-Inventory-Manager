import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const pool = getPool();
  const result = await pool.query("select now() as now, version() as version");

  return NextResponse.json({
    ok: true,
    now: result.rows[0]?.now ?? null,
    version: result.rows[0]?.version ?? null,
  });
}

