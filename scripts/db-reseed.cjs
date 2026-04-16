// Deletes all data (including auth users), resets sequences, then runs db-setup.
// Usage: node scripts/db-reseed.cjs  OR  npm run db:reseed

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Pool } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Deleting all application data...");
  await pool.query(`
    DELETE FROM container_cargo;
    DELETE FROM containers;
    DELETE FROM inventory_records;
    DELETE FROM shipments;
    DELETE FROM manages;
    DELETE FROM warehouse_staff;
    DELETE FROM admins;
    DELETE FROM admin_access_requests;
    DELETE FROM audit_logs;
    DELETE FROM cargo_items;
    DELETE FROM warehouses;
    DELETE FROM routes;
    DELETE FROM carriers;
    DELETE FROM locations;
    DELETE FROM users;
  `);

  console.log("Resetting sequences...");
  await pool.query(`
    ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
    ALTER SEQUENCE locations_location_id_seq RESTART WITH 1;
    ALTER SEQUENCE warehouses_warehouse_id_seq RESTART WITH 1;
    ALTER SEQUENCE carriers_carrier_id_seq RESTART WITH 1;
    ALTER SEQUENCE routes_route_id_seq RESTART WITH 1;
    ALTER SEQUENCE cargo_items_cargo_id_seq RESTART WITH 1;
    ALTER SEQUENCE shipments_shipment_id_seq RESTART WITH 1;
    ALTER SEQUENCE containers_container_id_seq RESTART WITH 1;
    ALTER SEQUENCE admin_access_requests_request_id_seq RESTART WITH 1;
    ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;
  `);

  console.log("Deleting Supabase Auth users...");
  try {
    const { rows } = await pool.query("SELECT id, email FROM auth.users");
    for (const u of rows) {
      await pool.query("DELETE FROM auth.users WHERE id = $1", [u.id]);
      console.log(`  Deleted auth user: ${u.email}`);
    }
  } catch (err) {
    console.log("  Could not access auth.users: " + err.message);
  }

  await pool.end();
  console.log("Data cleared.\n");

  // Now run the full setup (re-seeds + creates auth users)
  require("./db-setup.cjs");
}

main().catch(e => { console.error(e); process.exit(1); });
