// Simple script to apply all SQL files in the sql/ directory to the database
// Usage: pnpm db:setup (or npm run db:setup)

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Pool } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Please configure it in .env.local or your shell.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const sqlDir = path.join(__dirname, "..", "sql");
  const filesInOrder = [
    "001_schema.sql",
    "002_views.sql",
    "003_functions_triggers.sql",
    "004_seed.sql",
  ];

  try {
    console.log("Applying SQL files to database...");
    for (const file of filesInOrder) {
      const fullPath = path.join(sqlDir, file);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Skipping missing file: ${file}`);
        continue;
      }
      console.log(`Running ${file}...`);
      const sql = fs.readFileSync(fullPath, "utf8");
      await pool.query(sql);
    }
    console.log("Database setup completed successfully.");
  } catch (err) {
    console.error("Database setup failed:");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

