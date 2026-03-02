// scripts/seed.ts
// Wipes all tables and reseeds with sample data from data.ts
// Run with: npm run db:seed

import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// ─── Colours ──────────────────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",  bold:   "\x1b[1m",  dim:    "\x1b[2m",
  green:  "\x1b[32m", yellow: "\x1b[33m", blue:   "\x1b[34m",
  cyan:   "\x1b[36m", red:    "\x1b[31m", white:  "\x1b[97m", grey: "\x1b[90m",
};
const fmt = {
  ok:    (s: string) => `  ${c.green}${c.bold}✔${c.reset}  ${s}`,
  err:   (s: string) => `  ${c.red}${c.bold}✘${c.reset}  ${s}`,
  info:  (s: string) => `  ${c.cyan}${c.bold}→${c.reset}  ${s}`,
  warn:  (s: string) => `  ${c.yellow}${c.bold}!${c.reset}  ${s}`,
  dim:   (s: string) => `${c.dim}${s}${c.reset}`,
  table: (s: string) => `${c.blue}${c.bold}${s}${c.reset}`,
  count: (n: number) => `${c.white}${c.bold}${n}${c.reset} ${c.dim}rows${c.reset}`,
};

// ─── Load .env.local ──────────────────────────────────────────────────────────
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

// ─── DB client ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL!,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

// ─── Banner ───────────────────────────────────────────────────────────────────
function banner(title: string, colour: string) {
  const w = 50;
  const pad = " ".repeat(Math.max(0, w - title.length - 4));
  console.log(`\n${colour}${c.bold}┌${"─".repeat(w)}┐${c.reset}`);
  console.log(`${colour}${c.bold}│${c.reset}  ${c.white}${c.bold}${title}${c.reset}${pad}  ${colour}${c.bold}│${c.reset}`);
  console.log(`${colour}${c.bold}└${"─".repeat(w)}┘${c.reset}\n`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function insert<T>(
  label: string,
  rows: T[],
  fn: (rows: T[]) => Promise<unknown>
) {
  try {
    await fn(rows);
    console.log(fmt.ok(`${fmt.table(label.padEnd(20))} ${fmt.count(rows.length)}`));
  } catch (e: any) {
    console.error(fmt.err(`${label}: ${e.message}`));
    throw e;
  }
}

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seed() {
  banner("Freight Cargo — Database Seed", c.blue);
  console.log(fmt.info("Connecting to Supabase...\n"));

  // ── 1. Locations ─────────────────────────────────────────────────────────
  const locations: schema.NewLocation[] = [
    { locationId: "11111111-0001-0000-0000-000000000000", locationName: "Newark, NJ",     locationType: "warehouse" },
    { locationId: "11111111-0002-0000-0000-000000000000", locationName: "Long Beach, CA", locationType: "warehouse" },
    { locationId: "11111111-0003-0000-0000-000000000000", locationName: "Houston, TX",    locationType: "warehouse" },
    { locationId: "11111111-0004-0000-0000-000000000000", locationName: "Chicago, IL",    locationType: "warehouse" },
    { locationId: "11111111-0005-0000-0000-000000000000", locationName: "Atlanta, GA",    locationType: "warehouse" },
  ];
  await insert("Location", locations, (r) => db.insert(schema.location).values(r));

  // ── 2. Routes ─────────────────────────────────────────────────────────────
  const routes: schema.Route[] = [
    { routeId: "22222222-0001-0000-0000-000000000000", estimatedTime: 168 },
    { routeId: "22222222-0002-0000-0000-000000000000", estimatedTime: 72  },
    { routeId: "22222222-0003-0000-0000-000000000000", estimatedTime: 144 },
    { routeId: "22222222-0004-0000-0000-000000000000", estimatedTime: 48  },
    { routeId: "22222222-0005-0000-0000-000000000000", estimatedTime: 48  },
    { routeId: "22222222-0006-0000-0000-000000000000", estimatedTime: 120 },
    { routeId: "22222222-0007-0000-0000-000000000000", estimatedTime: 96  },
  ];
  await insert("Route", routes, (r) => db.insert(schema.route).values(r));

  // ── 3. Carriers ───────────────────────────────────────────────────────────
  const carriers: schema.NewCarrier[] = [
    { carrierId: "33333333-0001-0000-0000-000000000000", name: "Maersk Line",      carrierType: "sea" },
    { carrierId: "33333333-0002-0000-0000-000000000000", name: "MSC Shipping",     carrierType: "sea" },
    { carrierId: "33333333-0003-0000-0000-000000000000", name: "CMA CGM",          carrierType: "sea" },
    { carrierId: "33333333-0004-0000-0000-000000000000", name: "Evergreen Marine", carrierType: "sea" },
    { carrierId: "33333333-0005-0000-0000-000000000000", name: "Hapag-Lloyd",      carrierType: "sea" },
  ];
  await insert("Carrier", carriers, (r) => db.insert(schema.carrier).values(r));

  // ── 4. Warehouses ─────────────────────────────────────────────────────────
  const warehouses: schema.NewWarehouse[] = [
    { warehouseId: "44444444-0001-0000-0000-000000000000", name: "East Coast Hub",           address: "100 Port Ave, Newark, NJ 07114",          capacity: 1000, locationId: "11111111-0001-0000-0000-000000000000" },
    { warehouseId: "44444444-0002-0000-0000-000000000000", name: "West Coast Terminal",      address: "200 Terminal Blvd, Long Beach, CA 90802", capacity: 1500, locationId: "11111111-0002-0000-0000-000000000000" },
    { warehouseId: "44444444-0003-0000-0000-000000000000", name: "Gulf Distribution Center", address: "300 Freight Rd, Houston, TX 77001",        capacity: 800,  locationId: "11111111-0003-0000-0000-000000000000" },
    { warehouseId: "44444444-0004-0000-0000-000000000000", name: "Midwest Logistics Park",   address: "400 Logistics Dr, Chicago, IL 60601",     capacity: 600,  locationId: "11111111-0004-0000-0000-000000000000" },
    { warehouseId: "44444444-0005-0000-0000-000000000000", name: "Southeast Depot",          address: "500 Depot St, Atlanta, GA 30301",         capacity: 750,  locationId: "11111111-0005-0000-0000-000000000000" },
  ];
  await insert("Warehouse", warehouses, (r) => db.insert(schema.warehouse).values(r));

  // ── 5. Users ──────────────────────────────────────────────────────────────
  const users: schema.User[] = [
    { userId: "55555555-0001-0000-0000-000000000000", name: "Alex Morgan",  email: "alex.morgan@freight.co",   password: "hashed_pw", roleId: "admin"           },
    { userId: "55555555-0002-0000-0000-000000000000", name: "Jordan Lee",   email: "jordan.lee@freight.co",    password: "hashed_pw", roleId: "warehouse_staff" },
    { userId: "55555555-0003-0000-0000-000000000000", name: "Sam Rivera",   email: "sam.rivera@freight.co",    password: "hashed_pw", roleId: "warehouse_staff" },
    { userId: "55555555-0004-0000-0000-000000000000", name: "Taylor Kim",   email: "taylor.kim@freight.co",    password: "hashed_pw", roleId: "admin"           },
    { userId: "55555555-0005-0000-0000-000000000000", name: "Casey Patel",  email: "casey.patel@freight.co",   password: "hashed_pw", roleId: "warehouse_staff" },
    { userId: "55555555-0006-0000-0000-000000000000", name: "Morgan Chen",  email: "morgan.chen@freight.co",   password: "hashed_pw", roleId: "warehouse_staff" },
  ];
  await insert("User", users, (r) => db.insert(schema.user).values(r));

  // ── 6. Admins ─────────────────────────────────────────────────────────────
  const admins: schema.Admin[] = [
    { userId: "55555555-0001-0000-0000-000000000000", adminLevel: 2 },
    { userId: "55555555-0004-0000-0000-000000000000", adminLevel: 1 },
  ];
  await insert("Admin", admins, (r) => db.insert(schema.admin).values(r));

  // ── 7. Warehouse Staff ────────────────────────────────────────────────────
  const staff: schema.WarehouseStaff[] = [
    { userId: "55555555-0002-0000-0000-000000000000", jobTitle: "Inventory Clerk",   shift: "morning"   },
    { userId: "55555555-0003-0000-0000-000000000000", jobTitle: "Dock Supervisor",   shift: "afternoon" },
    { userId: "55555555-0005-0000-0000-000000000000", jobTitle: "Forklift Operator", shift: "night"     },
    { userId: "55555555-0006-0000-0000-000000000000", jobTitle: "Inventory Clerk",   shift: "morning"   },
  ];
  await insert("WarehouseStaff", staff, (r) => db.insert(schema.warehouseStaff).values(r));

  // ── 8. Manages ────────────────────────────────────────────────────────────
  const managesRows: schema.Manages[] = [
    { adminUserId: "55555555-0001-0000-0000-000000000000", warehouseId: "44444444-0001-0000-0000-000000000000" },
    { adminUserId: "55555555-0001-0000-0000-000000000000", warehouseId: "44444444-0002-0000-0000-000000000000" },
    { adminUserId: "55555555-0004-0000-0000-000000000000", warehouseId: "44444444-0003-0000-0000-000000000000" },
    { adminUserId: "55555555-0004-0000-0000-000000000000", warehouseId: "44444444-0004-0000-0000-000000000000" },
    { adminUserId: "55555555-0004-0000-0000-000000000000", warehouseId: "44444444-0005-0000-0000-000000000000" },
  ];
  await insert("Manages", managesRows, (r) => db.insert(schema.manages).values(r));

  // ── 9. Cargo Items ────────────────────────────────────────────────────────
  const cargoItems: schema.NewCargoItem[] = [
    { cargoId: "66666666-0001-0000-0000-000000000000", cargoType: "Electronics",      weight: "2400.00"  },
    { cargoId: "66666666-0002-0000-0000-000000000000", cargoType: "Machinery",        weight: "6000.00"  },
    { cargoId: "66666666-0003-0000-0000-000000000000", cargoType: "Textiles",         weight: "1000.00"  },
    { cargoId: "66666666-0004-0000-0000-000000000000", cargoType: "Food & Beverage",  weight: "4500.00"  },
    { cargoId: "66666666-0005-0000-0000-000000000000", cargoType: "Chemicals",        weight: "3000.00"  },
    { cargoId: "66666666-0006-0000-0000-000000000000", cargoType: "Automotive Parts", weight: "5250.00"  },
    { cargoId: "66666666-0007-0000-0000-000000000000", cargoType: "Raw Materials",    weight: "40000.00" },
    { cargoId: "66666666-0008-0000-0000-000000000000", cargoType: "Electronics",      weight: "960.00"   },
    { cargoId: "66666666-0009-0000-0000-000000000000", cargoType: "Textiles",         weight: "700.00"   },
    { cargoId: "66666666-0010-0000-0000-000000000000", cargoType: "Automotive Parts", weight: "2100.00"  },
  ];
  await insert("CargoItem", cargoItems, (r) => db.insert(schema.cargoItem).values(r));

  // ── 10. Inventory Records ─────────────────────────────────────────────────
  const inventory: schema.NewInventoryRecord[] = [
    { cargoId: "66666666-0001-0000-0000-000000000000", warehouseId: "44444444-0001-0000-0000-000000000000", quantityStored: 48   },
    { cargoId: "66666666-0002-0000-0000-000000000000", warehouseId: "44444444-0002-0000-0000-000000000000", quantityStored: 120  },
    { cargoId: "66666666-0003-0000-0000-000000000000", warehouseId: "44444444-0003-0000-0000-000000000000", quantityStored: 500  },
    { cargoId: "66666666-0004-0000-0000-000000000000", warehouseId: "44444444-0004-0000-0000-000000000000", quantityStored: 300  },
    { cargoId: "66666666-0005-0000-0000-000000000000", warehouseId: "44444444-0001-0000-0000-000000000000", quantityStored: 1500 },
    { cargoId: "66666666-0006-0000-0000-000000000000", warehouseId: "44444444-0005-0000-0000-000000000000", quantityStored: 75   },
    { cargoId: "66666666-0007-0000-0000-000000000000", warehouseId: "44444444-0002-0000-0000-000000000000", quantityStored: 200  },
    { cargoId: "66666666-0008-0000-0000-000000000000", warehouseId: "44444444-0003-0000-0000-000000000000", quantityStored: 800  },
    { cargoId: "66666666-0009-0000-0000-000000000000", warehouseId: "44444444-0004-0000-0000-000000000000", quantityStored: 350  },
    { cargoId: "66666666-0010-0000-0000-000000000000", warehouseId: "44444444-0005-0000-0000-000000000000", quantityStored: 420  },
  ];
  await insert("InventoryRecord", inventory, (r) => db.insert(schema.inventoryRecord).values(r));

  // ── 11. Shipments ─────────────────────────────────────────────────────────
  const shipments: schema.NewShipment[] = [
    { shipmentId: "77777777-0001-0000-0000-000000000000", shipmentDate: "2026-02-10", status: "in_transit", carrierId: "33333333-0001-0000-0000-000000000000", routeId: "22222222-0001-0000-0000-000000000000", originLocId: "11111111-0001-0000-0000-000000000000", destinationLocId: "11111111-0002-0000-0000-000000000000" },
    { shipmentId: "77777777-0002-0000-0000-000000000000", shipmentDate: "2026-02-18", status: "pending",    carrierId: "33333333-0002-0000-0000-000000000000", routeId: "22222222-0002-0000-0000-000000000000", originLocId: "11111111-0003-0000-0000-000000000000", destinationLocId: "11111111-0001-0000-0000-000000000000" },
    { shipmentId: "77777777-0003-0000-0000-000000000000", shipmentDate: "2026-02-01", status: "delivered",  carrierId: "33333333-0003-0000-0000-000000000000", routeId: "22222222-0003-0000-0000-000000000000", originLocId: "11111111-0002-0000-0000-000000000000", destinationLocId: "11111111-0004-0000-0000-000000000000" },
    { shipmentId: "77777777-0004-0000-0000-000000000000", shipmentDate: "2026-02-12", status: "in_transit", carrierId: "33333333-0004-0000-0000-000000000000", routeId: "22222222-0004-0000-0000-000000000000", originLocId: "11111111-0004-0000-0000-000000000000", destinationLocId: "11111111-0005-0000-0000-000000000000" },
    { shipmentId: "77777777-0005-0000-0000-000000000000", shipmentDate: "2026-02-20", status: "pending",    carrierId: "33333333-0005-0000-0000-000000000000", routeId: "22222222-0005-0000-0000-000000000000", originLocId: "11111111-0005-0000-0000-000000000000", destinationLocId: "11111111-0003-0000-0000-000000000000" },
    { shipmentId: "77777777-0006-0000-0000-000000000000", shipmentDate: "2026-01-28", status: "delivered",  carrierId: "33333333-0001-0000-0000-000000000000", routeId: "22222222-0006-0000-0000-000000000000", originLocId: "11111111-0001-0000-0000-000000000000", destinationLocId: "11111111-0005-0000-0000-000000000000" },
    { shipmentId: "77777777-0007-0000-0000-000000000000", shipmentDate: "2026-02-14", status: "in_transit", carrierId: "33333333-0002-0000-0000-000000000000", routeId: "22222222-0007-0000-0000-000000000000", originLocId: "11111111-0002-0000-0000-000000000000", destinationLocId: "11111111-0003-0000-0000-000000000000" },
  ];
  await insert("Shipment", shipments, (r) => db.insert(schema.shipment).values(r));

  // ── 12. Containers ────────────────────────────────────────────────────────
  const containers: schema.NewContainer[] = [
    { containerId: "88888888-0001-0000-0000-000000000000", containerType: "20ft Standard",  maxCapacity: "33.0", shipmentId: "77777777-0001-0000-0000-000000000000" },
    { containerId: "88888888-0002-0000-0000-000000000000", containerType: "40ft High Cube", maxCapacity: "76.0", shipmentId: null },
    { containerId: "88888888-0003-0000-0000-000000000000", containerType: "20ft Standard",  maxCapacity: "33.0", shipmentId: "77777777-0002-0000-0000-000000000000" },
    { containerId: "88888888-0004-0000-0000-000000000000", containerType: "40ft Standard",  maxCapacity: "67.0", shipmentId: "77777777-0004-0000-0000-000000000000" },
    { containerId: "88888888-0005-0000-0000-000000000000", containerType: "20ft Reefer",    maxCapacity: "28.0", shipmentId: null },
    { containerId: "88888888-0006-0000-0000-000000000000", containerType: "40ft High Cube", maxCapacity: "76.0", shipmentId: null },
    { containerId: "88888888-0007-0000-0000-000000000000", containerType: "20ft Standard",  maxCapacity: "33.0", shipmentId: "77777777-0007-0000-0000-000000000000" },
    { containerId: "88888888-0008-0000-0000-000000000000", containerType: "40ft Reefer",    maxCapacity: "60.0", shipmentId: null },
  ];
  await insert("Container", containers, (r) => db.insert(schema.container).values(r));

  // ── 13. ContainerCargo ────────────────────────────────────────────────────
  const ccRows: schema.ContainerCargo[] = [
    { cargoId: "66666666-0003-0000-0000-000000000000", containerId: "88888888-0003-0000-0000-000000000000" },
    { cargoId: "66666666-0005-0000-0000-000000000000", containerId: "88888888-0001-0000-0000-000000000000" },
    { cargoId: "66666666-0009-0000-0000-000000000000", containerId: "88888888-0004-0000-0000-000000000000" },
  ];
  await insert("ContainerCargo", ccRows, (r) => db.insert(schema.containerCargo).values(r));

  // ── Done ──────────────────────────────────────────────────────────────────
  banner("Seed complete!", c.green);
  await pool.end();
}

seed().catch(async (e) => {
  console.error(fmt.err(e.message));
  await pool.end();
  process.exit(1);
});