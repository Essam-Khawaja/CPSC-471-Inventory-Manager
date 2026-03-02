import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

// Load .env.local without needing dotenv as a runtime dep
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

export default defineConfig({
  schema:    "./lib/db/schema.ts",
  out:       "./drizzle",           // migration files live here
  dialect:   "postgresql",
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL!,
  },
  verbose: true,
  strict:  true,
});