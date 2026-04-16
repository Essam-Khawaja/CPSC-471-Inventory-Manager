// Applies all SQL migration files in order, then seeds Supabase Auth users.
// Usage: pnpm db:setup (or npm run db:setup)

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Pool } = require("pg");

const SEED_USERS = [
  "admin@example.com",
  "test@example.com",
  "staff1@example.com",
  "staff2@example.com",
  "staff3@example.com",
  "staff4@example.com",
  "staff5@example.com",
];

const SEED_PASSWORD = "dev-only";

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
    "005_auth_enhancements.sql",
  ];

  try {
    console.log("Applying SQL files to database...");
    for (const file of filesInOrder) {
      const fullPath = path.join(sqlDir, file);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Skipping missing file: ${file}`);
        continue;
      }
      console.log(`  Running ${file}...`);
      const sql = fs.readFileSync(fullPath, "utf8");
      await pool.query(sql);
    }
    console.log("Database schema and seed data applied.\n");
  } catch (err) {
    console.error("Database setup failed:");
    console.error(err.message);
    process.exitCode = 1;
    await pool.end();
    return;
  }

  // Create Supabase Auth accounts via direct SQL insert into auth.users + auth.identities.
  // Uses extensions.crypt() for bcrypt password hashing (same as Supabase dashboard).
  console.log("Creating Supabase Auth users...");

  // Pre-compute bcrypt hash once (all seed users share the same password)
  let pwdHash;
  try {
    const hashRes = await pool.query(
      "SELECT extensions.crypt($1, extensions.gen_salt('bf')) AS hash",
      [SEED_PASSWORD]
    );
    pwdHash = hashRes.rows[0].hash;
  } catch (err) {
    console.log("  Could not hash password (pgcrypto may be unavailable). Skipping auth seeding.");
    console.log("  Error: " + err.message);
    await pool.end();
    return;
  }

  for (const email of SEED_USERS) {
    try {
      const exists = await pool.query(
        "SELECT 1 FROM auth.users WHERE email = $1 LIMIT 1",
        [email]
      );
      if ((exists.rowCount ?? 0) > 0) {
        console.log(`  ${email} - already exists, skipped.`);
        continue;
      }

      // Insert into auth.users
      const userRes = await pool.query(`
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          raw_app_meta_data, raw_user_meta_data,
          is_sso_user, is_anonymous,
          confirmation_token, recovery_token,
          email_change_token_new, email_change,
          email_change_token_current, phone_change,
          phone_change_token, reauthentication_token
        ) VALUES (
          gen_random_uuid(),
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated',
          $1, $2,
          NOW(), NOW(), NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{"email_verified":true}'::jsonb,
          false, false,
          '', '', '', '', '', '', '', ''
        )
        RETURNING id
      `, [email, pwdHash]);

      const uid = userRes.rows[0].id;

      // Insert into auth.identities
      await pool.query(`
        INSERT INTO auth.identities (
          id, user_id, provider_id, provider, identity_data,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $1::TEXT, 'email',
          jsonb_build_object('sub', $1::TEXT, 'email', $2, 'email_verified', true),
          NOW(), NOW(), NOW()
        )
      `, [uid, email]);

      console.log(`  ${email} - created.`);
    } catch (err) {
      console.log(`  ${email} - failed: ${err.message}`);
    }
  }

  await pool.end();
  console.log(`\nSetup complete. All seed users have password: "${SEED_PASSWORD}"`);
}

main();
