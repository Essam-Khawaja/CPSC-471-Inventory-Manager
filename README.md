# Freight Cargo Inventory and Shipment Management System

**Muhammad Ahmad 30239993**
**Syed Essam Uddin Khawaja 30242943**
**Muhammad Zohaib Talat 30257908**

**CPSC 471 W26 - Group G-4**

---

## Table of Contents

1. [Overview](#overview)
2. [Live Demo](#live-demo)
3. [Technology Stack](#technology-stack)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Setting Up Your Own Supabase Project](#setting-up-your-own-supabase-project)
7. [Environment Variables](#environment-variables)
8. [Database Setup](#database-setup)
9. [Running the Application](#running-the-application)
10. [Seed Accounts](#seed-accounts)
11. [SQL Files Reference](#sql-files-reference)
12. [Database Schema Overview](#database-schema-overview)
13. [Views, Functions, and Triggers](#views-functions-and-triggers)
14. [Running SQL Queries in Supabase](#running-sql-queries-in-supabase)
15. [Application Features](#application-features)
16. [Documentation and Diagrams](#documentation-and-diagrams)

---

## Overview

This project is a freight cargo inventory and shipment management system built for CPSC 471 (Database Management Systems). It is a **databases-first** application: the core value lies in a normalized PostgreSQL schema with views, triggers, stored functions, and comprehensive seed data. A modern Next.js frontend surfaces and manipulates that data via direct SQL queries (no ORM).

The system supports two user roles:
- **Admin** - full CRUD access to all entities, user management, warehouse management, reporting, and approval workflows
- **Warehouse Staff** - scoped access to inventory, shipments, containers, and cargo for their assigned warehouse

---

## Live Demo

A running demo is deployed on Vercel and connected to a Supabase PostgreSQL instance:

> **https://cpsc-471-inventory-manager.vercel.app**

You can log in with any of the seed accounts listed in the [Seed Accounts](#seed-accounts) section below. The shared password for all demo accounts is `dev-only`.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, App Router |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL (hosted on Supabase) |
| Data Access | `pg` package via `getPool()` in `lib/db.ts`; direct parameterized SQL from server components |
| Authentication | Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`) |
| Icons | `lucide-react` |
| Deployment | Vercel (frontend), Supabase (database and auth) |

---

## Repository Structure

```
CPSC-471-Inventory-Manager/
|-- app/                          # Next.js App Router pages and API routes
|   |-- page.tsx                  # Dashboard (home page)
|   |-- login/page.tsx            # Login page (client component)
|   |-- register/page.tsx         # Registration page
|   |-- pending/page.tsx          # Pending approval page
|   |-- warehouses/page.tsx       # Warehouses CRUD
|   |-- inventory/page.tsx        # Inventory management
|   |-- shipments/page.tsx        # Shipments CRUD
|   |-- containers/page.tsx       # Containers CRUD
|   |-- cargo/page.tsx            # Cargo items CRUD
|   |-- carriers/page.tsx         # Carriers CRUD (admin only)
|   |-- routes/page.tsx           # Routes CRUD (admin only)
|   |-- locations/page.tsx        # Locations CRUD (admin only)
|   |-- reports/page.tsx          # Reporting with SQL views (admin only)
|   |-- users/page.tsx            # User management (admin only)
|   |-- admin/approvals/
|   |   |-- users/page.tsx        # Approve pending registrations
|   |   |-- admin-requests/page.tsx # Approve staff-to-admin promotions
|   |-- staff/request-admin/page.tsx # Staff requests admin promotion
|   |-- api/
|       |-- db/health/route.ts    # Database health check endpoint
|       |-- register/route.ts     # Registration API
|       |-- admin/user/route.ts   # Admin user management API
|-- components/                   # Shared React components
|   |-- layout/                   # LayoutShell, Sidebar, Topbar
|   |-- dashboard/                # DashboardOverview
|   |-- users/                    # UpdateUserPanel
|   |-- ui/                       # CharLimitTextarea
|-- lib/                          # Server-side libraries
|   |-- db.ts                     # PostgreSQL pool (pg)
|   |-- auth.ts                   # getCurrentUser() - role resolution
|   |-- supabase-browser.ts       # Supabase client for browser
|   |-- supabase-server.ts        # Supabase client for server (cookies)
|   |-- theme-context.tsx         # Dark mode context provider
|-- sql/                          # Ordered SQL migration files
|   |-- 001_schema.sql            # Core tables and indexes
|   |-- 002_views.sql             # Database views
|   |-- 003_functions_triggers.sql # Stored functions and triggers
|   |-- 004_seed.sql              # Seed data (users, locations, warehouses, etc.)
|   |-- 005_auth_enhancements.sql # Account status and admin access requests
|-- scripts/                      # Setup and maintenance scripts
|   |-- db-setup.cjs              # Applies all SQL files + creates auth users
|   |-- db-reseed.cjs             # Wipes everything and re-runs setup
|-- docs/                         # Final diagrams, design notes, screenshots
|   |-- design-notes.md           # Explanation of all diagrams
|   |-- RM&EERD/                  # draw.io EERD and Relational Model diagrams
|   |-- plantuml/                 # PlantUML diagrams (schema, auth, architecture, etc.)
|   |-- platform-pictures/        # Screenshots of all application pages
|   |-- supabase-pictures/        # Screenshots of Supabase dashboard and SQL runner
|   |-- old-docs/                 # Archived proposal, progress reports, and earlier diagrams
|-- .env.example                  # Template for environment variables
|-- package.json                  # Dependencies and scripts
|-- tailwind.config.ts            # Tailwind configuration
|-- tsconfig.json                 # TypeScript configuration
```

---

## Prerequisites

Before setting up the project, ensure you have:

1. **Node.js** (v18 or later) and **npm** (or **pnpm**)
2. A **Supabase** account (free tier is sufficient) - [https://supabase.com](https://supabase.com)
3. **Git** for cloning the repository

---

## Setting Up Your Own Supabase Project

Follow these steps to create a new Supabase project and connect it to this application:

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in
2. Click **New Project**
3. Choose an organization, give the project a name (e.g., "freight-cargo"), and set a **database password** (save this; you will need it for the connection string)
4. Select a region close to you and click **Create new project**
5. Wait for the project to finish provisioning (usually 1-2 minutes)

### Step 2: Get `DATABASE_URL` from the ORM tab

1. Open your Supabase project
2. Click **Connect**
3. In the **Connect to your project** dialog, open the **ORM** tab
4. Select **Prisma** if Supabase asks which ORM snippet to show
5. Copy the `DATABASE_URL` value from the generated env snippet
6. It will look like: `postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
7. Replace `[YOUR_PASSWORD]` with the database password you set in Step 1
8. Supabase may also show a `DIRECT_URL`, but this repository only requires `DATABASE_URL`

### Step 3: Get `NEXT_PUBLIC_SUPABASE_URL` and the public client key from the Framework tab

1. In the same **Connect to your project** dialog, switch to **Framework**
2. Choose **Next.js** and **App Router**
3. Copy `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the public client key shown in that snippet
5. If Supabase labels it as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, use that value for this repository's `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Enable pgcrypto Extension

The auth seeding script uses `extensions.crypt()` for bcrypt password hashing. This is typically enabled by default on Supabase, but verify:

1. In the Supabase dashboard, go to **Database** in the left sidebar
2. Click **Extensions**
3. Search for `pgcrypto` and make sure it is enabled

---

## Environment Variables

Create a file called `.env.local` in the project root (this file is gitignored and will not be committed):

```bash
# PostgreSQL connection string (from Supabase -> Connect -> ORM)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase client values (from Supabase -> Connect -> Framework -> Next.js/App Router)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Key required to demote an admin back to staff (can be any string)
DEMOTION_KEY=cpsc471
```

A template is provided in `.env.example` for reference.

Supabase's Framework snippet may name the public key `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; for this codebase, paste that same value into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Supabase's ORM snippet may also include `DIRECT_URL`, but the current project does not use it.

**Important:** Never commit `.env.local` to version control. It contains your database password and API keys.

---

## Database Setup

Once your `.env.local` is configured, run the database setup command:

```bash
# Install dependencies first
npm install

# Apply schema, seed data, and create auth users
npm run db:setup
```

This command executes `scripts/db-setup.cjs`, which does the following in order:

1. **Connects** to your Supabase PostgreSQL using `DATABASE_URL`
2. **Runs `001_schema.sql`** - creates all 13 core tables with constraints, foreign keys, and indexes:
   - `users`, `admins`, `warehouse_staff`, `locations`, `warehouses`, `manages`
   - `cargo_items`, `inventory_records`, `carriers`, `routes`, `shipments`
   - `containers`, `container_cargo`
   - Plus a deferred `ALTER TABLE` to add `warehouse_id` to `warehouse_staff`
3. **Runs `002_views.sql`** - creates two reporting views:
   - `view_shipment_summary` - joins shipments with carriers, containers, and cargo counts
   - `view_warehouse_inventory` - aggregates total units and weight per warehouse
4. **Runs `003_functions_triggers.sql`** - creates:
   - `audit_logs` table for tracking data changes
   - `fn_audit_log()` stored function for inserting audit entries
   - `fn_update_inventory()` stored function for safe inventory adjustments (prevents negative quantities)
   - `trg_inventory_records_audit` trigger that fires after every INSERT or UPDATE on `inventory_records`
5. **Runs `004_seed.sql`** - inserts realistic test data:
   - 7 users (2 admins, 5 staff)
   - 63 locations (ports, warehouses, terminals across 6 continents)
   - 12 warehouses (Calgary, Vancouver, Toronto, Montreal, Edmonton, Winnipeg, Ottawa, Rotterdam, Shanghai, Singapore, Dubai, Los Angeles)
   - 22 carriers (8 sea, 6 air, 4 rail, 4 road)
   - 19 routes with estimated transit times (1-45 days)
   - 30 cargo item types with realistic weights
   - 55 shipments across global trade lanes (25 delivered, 17 in transit, 8 pending, 5 cancelled)
   - 77 containers (65 assigned to shipments, 12 unassigned)
   - 43 container-cargo links
   - 45 inventory records across all 12 warehouses
   - Admin and staff warehouse assignments
6. **Runs `005_auth_enhancements.sql`** - adds account lifecycle:
   - `account_status` column on `users` table
   - `admin_access_requests` table for promotion workflow
   - Sets `staff5@example.com` to `pending_registration` status
   - Creates pending admin access requests for `staff1@example.com` and `staff2@example.com`
7. **Creates Supabase Auth users** via direct SQL INSERT into `auth.users` and `auth.identities`:
   - Hashes the shared password (`dev-only`) using `extensions.crypt()` with bcrypt
   - Creates 7 auth accounts matching the seed users
   - Sets `email_confirmed_at` so no email verification is needed
   - Sets all token columns to empty strings (required by Supabase GoTrue; NULL values cause "Database error querying schema" on login)

### Resetting the Database

To completely wipe all data and re-seed from scratch:

```bash
npm run db:reseed
```

This runs `scripts/db-reseed.cjs`, which:
1. Deletes all rows from all application tables (in correct FK order)
2. Resets all BIGSERIAL sequences to 1
3. Deletes all Supabase Auth users from `auth.users`
4. Runs the full `db:setup` process again

---

## Running the Application

```bash
# Development mode with hot reload
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the login page.

### Production Build

```bash
npm run build
npm run start
```

---

## Seed Accounts

All seed accounts share the password **`dev-only`**.

| Email | Role | Assigned Warehouses | Notes |
|---|---|---|---|
| `admin@example.com` | ADMIN | Calgary, Vancouver, Toronto, Edmonton, Rotterdam, Shanghai | Primary admin |
| `test@example.com` | ADMIN | Montreal, Winnipeg, Ottawa, Los Angeles, Singapore, Dubai | Secondary admin |
| `staff1@example.com` | STAFF | Calgary Central | Has a pending admin access request |
| `staff2@example.com` | STAFF | Vancouver Logistics | Has a pending admin access request |
| `staff3@example.com` | STAFF | Toronto Brampton | Active staff |
| `staff4@example.com` | STAFF | Montreal Dorval | Active staff |
| `staff5@example.com` | STAFF | Unassigned | `pending_registration` status (visible in Approve Users) |

---

## SQL Files Reference

All SQL is in the `sql/` directory and executed in order by `db:setup`:

### 001_schema.sql - Core Tables

Creates 13 tables with full constraint definitions:

```sql
-- Example: Users table with email uniqueness constraint
CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role_id INTEGER NOT NULL
);

-- Example: Inventory records as a weak entity with composite PK
CREATE TABLE IF NOT EXISTS inventory_records (
  cargo_id BIGINT NOT NULL REFERENCES cargo_items(cargo_id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
  quantity_stored INTEGER NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cargo_id, warehouse_id)
);

-- Example: Shipments with multiple FK references to locations
CREATE TABLE IF NOT EXISTS shipments (
  shipment_id BIGSERIAL PRIMARY KEY,
  shipment_date DATE NOT NULL,
  status TEXT NOT NULL,
  carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE RESTRICT,
  route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE RESTRICT,
  origin_loc_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
  destination_loc_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT
);
```

Also creates indexes on common lookup paths: `users(email)`, `warehouses(location_id)`, `inventory_records(warehouse_id)`, `shipments(status)`, `shipments(carrier_id)`, `containers(shipment_id)`, `warehouse_staff(warehouse_id)`.

### 002_views.sql - Reporting Views

```sql
-- Shipment summary view: per-shipment aggregates
CREATE OR REPLACE VIEW view_shipment_summary AS
SELECT s.shipment_id, s.status, s.shipment_date, c.name AS carrier_name,
       r.route_id, s.origin_loc_id, s.destination_loc_id,
       COUNT(DISTINCT ct.container_id) AS container_count,
       COUNT(DISTINCT cc.cargo_id) AS cargo_item_count
FROM shipments s
JOIN carriers c ON c.carrier_id = s.carrier_id
JOIN routes r ON r.route_id = s.route_id
LEFT JOIN containers ct ON ct.shipment_id = s.shipment_id
LEFT JOIN container_cargo cc ON cc.container_id = ct.container_id
GROUP BY s.shipment_id, s.status, s.shipment_date,
         c.name, r.route_id, s.origin_loc_id, s.destination_loc_id;

-- Warehouse inventory view: total units and weight per warehouse
CREATE OR REPLACE VIEW view_warehouse_inventory AS
SELECT w.warehouse_id, w.name AS warehouse_name,
       SUM(ir.quantity_stored) AS total_units,
       SUM(ir.quantity_stored * COALESCE(ci.weight, 0)) AS total_weight
FROM warehouses w
LEFT JOIN inventory_records ir ON ir.warehouse_id = w.warehouse_id
LEFT JOIN cargo_items ci ON ci.cargo_id = ir.cargo_id
GROUP BY w.warehouse_id, w.name;
```

### 003_functions_triggers.sql - Stored Logic

```sql
-- Stored function: safely adjusts inventory with negative-quantity guard
CREATE OR REPLACE FUNCTION fn_update_inventory(
  p_cargo_id BIGINT, p_warehouse_id BIGINT,
  p_delta_quantity INTEGER, p_staff_user_id BIGINT
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v_new_qty INTEGER;
BEGIN
  INSERT INTO inventory_records(cargo_id, warehouse_id, quantity_stored, last_updated)
  VALUES (p_cargo_id, p_warehouse_id, GREATEST(p_delta_quantity, 0), NOW())
  ON CONFLICT (cargo_id, warehouse_id)
  DO UPDATE SET
    quantity_stored = inventory_records.quantity_stored + p_delta_quantity,
    last_updated = NOW()
  RETURNING quantity_stored INTO v_new_qty;

  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Inventory quantity cannot be negative';
  END IF;

  PERFORM fn_audit_log(p_staff_user_id, 'INVENTORY_ADJUST',
    'inventory_records', NULL, JSONB_BUILD_OBJECT(
      'warehouse_id', p_warehouse_id, 'cargo_id', p_cargo_id,
      'delta_quantity', p_delta_quantity, 'new_quantity', v_new_qty));
END; $$;

-- Trigger: automatic audit logging on inventory changes
CREATE TRIGGER inventory_records_audit
AFTER INSERT OR UPDATE ON inventory_records
FOR EACH ROW EXECUTE FUNCTION trg_inventory_records_audit();
```

### 004_seed.sql - Test Data

Inserts a comprehensive global freight network dataset. Uses `ON CONFLICT` for idempotent user inserts and JOIN-based inserts for referential integrity (carriers matched by name, locations matched by name, etc.).

```sql
-- Users seeded with ON CONFLICT for idempotent re-runs
INSERT INTO users(name, email, password, role_id)
VALUES
  ('Admin User',       'admin@example.com',  'dev-only', 1),
  ('Test Admin',       'test@example.com',   'dev-only', 1),
  ('Alice Carter',     'staff1@example.com', 'dev-only', 2),
  ('Bob Nguyen',       'staff2@example.com', 'dev-only', 2),
  ('Clara Johansson',  'staff3@example.com', 'dev-only', 2),
  ('David Okafor',     'staff4@example.com', 'dev-only', 2),
  ('Emily Zhang',      'staff5@example.com', 'dev-only', 2)
ON CONFLICT (email) DO NOTHING;

-- Warehouses inserted via JOIN to resolve location FKs by name
INSERT INTO warehouses(name, address, capacity, location_id)
SELECT v.wname, v.addr, v.cap, l.location_id
FROM (VALUES
  ('Calgary Central Warehouse'::TEXT, '2850 Sunridge Blvd NE, Calgary, AB'::TEXT,
    3500000::INT, 'Calgary Central Warehouse'::TEXT),
  ('Vancouver Logistics Park', '1255 Commissioner St, Vancouver, BC',
    1500000, 'Vancouver Logistics Park'),
  -- ... 10 more warehouses across Canada, Europe, Asia, Americas ...
) AS v(wname, addr, cap, locname)
JOIN locations l ON l.location_name = v.locname;

-- Shipments use multi-table JOINs to resolve carrier, route, and location FKs
INSERT INTO shipments(shipment_date, status, carrier_id, route_id,
                      origin_loc_id, destination_loc_id)
SELECT v.d::DATE, v.st, c.carrier_id, r.route_id,
       lo.location_id, ld.location_id
FROM (VALUES
  ('2025-10-05'::TEXT, 'DELIVERED'::TEXT, 'Maersk Line'::TEXT, 14::INT,
    'Port of Shanghai'::TEXT, 'Vancouver Fraser Port'::TEXT),
  ('2026-01-05', 'IN_TRANSIT', 'Hapag-Lloyd', 24,
    'Port of Rotterdam', 'Vancouver Fraser Port'),
  ('2026-03-23', 'PENDING', 'Maersk Line', 30,
    'Port of Shanghai', 'Port of Savannah'),
  -- ... 52 more shipments across global trade lanes ...
) AS v(d, st, carrier_name, est_time, origin_name, dest_name)
JOIN carriers  c  ON c.name = v.carrier_name
JOIN routes    r  ON r.estimated_time = v.est_time
JOIN locations lo ON lo.location_name = v.origin_name
JOIN locations ld ON ld.location_name = v.dest_name;

-- Inventory records use UPSERT to handle re-runs
INSERT INTO inventory_records(cargo_id, warehouse_id, quantity_stored, last_updated)
SELECT ci.cargo_id, w.warehouse_id, v.qty, v.ts::TIMESTAMPTZ
FROM (VALUES
  ('Consumer Electronics Pallets'::TEXT, 'Calgary Central Warehouse'::TEXT,
    45, '2026-03-15 10:30:00'::TEXT),
  ('Softwood Lumber Bundle', 'Calgary Central Warehouse',
    120, '2026-03-14 08:00:00'),
  -- ... 43 more inventory records across all 12 warehouses ...
) AS v(cargo_name, wh_name, qty, ts)
JOIN cargo_items ci ON ci.cargo_type = v.cargo_name
JOIN warehouses  w  ON w.name = v.wh_name
ON CONFLICT (cargo_id, warehouse_id) DO UPDATE SET
  quantity_stored = EXCLUDED.quantity_stored,
  last_updated    = EXCLUDED.last_updated;
```

### 005_auth_enhancements.sql - Account Lifecycle

Adds the `account_status` column and `admin_access_requests` table for the registration approval and staff-to-admin promotion workflows.

```sql
-- Account lifecycle: pending_registration -> active / rejected / disabled
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

-- Table for staff-to-admin promotion requests
CREATE TABLE IF NOT EXISTS admin_access_requests (
  request_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL,
  resolved_by_user_id BIGINT NULL REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_user ON admin_access_requests(user_id);

-- Staff5 (Emily Zhang) is a newly registered user awaiting approval
UPDATE users SET account_status = 'pending_registration'
WHERE email = 'staff5@example.com' AND account_status = 'active';

-- Staff1 and Staff2 have requested admin access (idempotent)
INSERT INTO admin_access_requests (user_id, reason)
SELECT user_id,
  'I have been managing Calgary Central Warehouse inventory for 6 months
   and need admin access to approve shipments and manage staff assignments.'
FROM users WHERE email = 'staff1@example.com'
AND NOT EXISTS (
  SELECT 1 FROM admin_access_requests
  WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff1@example.com')
);
```

---

## Database Schema Overview

The database consists of 15 relations organized into five conceptual groups:

**People:** `users` (supertype), `admins` (specialization), `warehouse_staff` (specialization), `manages` (admin-warehouse assignment)

**Places:** `locations` (ports, terminals, warehouses), `warehouses` (storage facilities linked to locations)

**Cargo and Stock:** `cargo_items` (freight types with weights), `inventory_records` (weak entity tracking quantity per cargo per warehouse)

**Movement:** `carriers`, `routes`, `shipments`, `containers`, `container_cargo` (M:N between cargo items and containers)

**Support:** `audit_logs` (automatic change tracking), `admin_access_requests` (promotion workflow)

---

## Views, Functions, and Triggers

| Object | Type | Purpose |
|---|---|---|
| `view_shipment_summary` | VIEW | Aggregates container and cargo counts per shipment with carrier names |
| `view_warehouse_inventory` | VIEW | Computes total units and total weight per warehouse |
| `fn_audit_log()` | FUNCTION | Inserts a row into `audit_logs` |
| `fn_update_inventory()` | FUNCTION | Upserts inventory records; raises exception if quantity goes negative; logs to audit |
| `trg_inventory_records_audit` | TRIGGER | Fires AFTER INSERT OR UPDATE on `inventory_records`; calls `fn_audit_log()` |

---

## Running SQL Queries in Supabase

If you need to run ad-hoc SQL queries (for example, to verify data or demonstrate database operations), you can use the **Supabase SQL Editor**:

1. Log in to your Supabase dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Write and execute any SQL query

Example queries you can run:

```sql
-- Count shipments by status
SELECT status, COUNT(*) FROM shipments GROUP BY status ORDER BY status;

-- View warehouse capacity utilization
SELECT w.name, w.capacity, COALESCE(vi.total_weight, 0) AS used,
       ROUND(COALESCE(vi.total_weight, 0) / w.capacity * 100, 1) AS pct_used
FROM warehouses w
LEFT JOIN view_warehouse_inventory vi ON vi.warehouse_id = w.warehouse_id
ORDER BY pct_used DESC;

-- Test the inventory adjustment function
SELECT fn_update_inventory(1, 1, 10, 1);

-- Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

Screenshots of the Supabase SQL Editor in action are included in `docs/supabase-pictures/`.

---

## Application Features

### Dashboard
- Personalized KPIs scoped to the logged-in user's assigned warehouses
- In-transit, pending, and delivered shipment counts
- Top carriers by shipment volume
- Recent shipments table
- Warehouse capacity utilization bars (red alert for overcapacity)

### Entity Management (CRUD)
All entity pages support Create, Read, Update, and Delete operations through server actions with parameterized SQL:
- Warehouses, Inventory, Shipments, Containers, Cargo Items, Carriers, Routes, Locations

### User Management (Admin)
- Create new users (creates both application user and Supabase Auth account)
- Update user details
- Assign users to warehouses
- Promote staff to admin / demote admin to staff (demotion requires DEMOTION_KEY)

### Approval Workflows
- **Approve Users** - admin reviews and approves/rejects pending registrations
- **Admin Requests** - admin reviews and approves/rejects staff promotion requests

### Reporting
- Warehouse inventory summary (from `view_warehouse_inventory`)
- Shipment summary (from `view_shipment_summary`)

### UI Features
- Dark mode (default) with light mode toggle
- Mobile-responsive layout with collapsible sidebar
- Role-filtered navigation (admin sees all sections; staff sees limited sections)

---

## Documentation and Diagrams

All project documentation is organized under the `docs/` folder:

| Path | Description |
|---|---|
| `docs/design-notes.md` | Reference guide for the final diagrams, implementation changes, and archived source material |
| `docs/RM&EERD/` | Final draw.io EERD and relational model files, plus exported PNG images |
| `docs/plantuml/` | PlantUML source files and rendered PNGs for schema, auth flow, architecture, setup, navigation, inventory, and lifecycle diagrams |
| `docs/platform-pictures/` | Screenshots of the application UI used in the final report |
| `docs/supabase-pictures/` | Screenshots of the Supabase dashboard, schema view, and SQL editor |
| `docs/old-docs/` | Archived proposal, progress reports, and earlier `Prog1` / `Prog2v2` draw.io drafts |
