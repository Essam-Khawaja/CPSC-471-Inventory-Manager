# Freight Cargo Inventory & Shipment Management – Project Context

## 1. High-level overview

This project is a freight cargo inventory and shipment management system built for CPSC 471 with a **databases-first** focus. The goal is to demonstrate:

- A normalized relational schema derived from the EERD / relational diagrams.
- Heavy use of **SQL** (tables, constraints, views, triggers, and stored functions).
- A modern but utilitarian **Next.js** frontend that surfaces and manipulates that data.
- Clear **role separation** between Admins and Warehouse Staff.

Current stack:

- **Frontend**: Next.js 15 (App Router, TypeScript, TailwindCSS), server components.
- **Backend**: Next.js route handlers + direct PostgreSQL access via `pg` and `DATABASE_URL`.
- **Database**: Supabase-hosted PostgreSQL, schema in `sql/*.sql`.
- **Tooling**: `pnpm db:setup` script to apply all SQL files to the configured database.

## 2. Database structure (current schema)

Defined in `sql/001_schema.sql`, with seed data / logic in `002_views.sql`, `003_functions_triggers.sql`, `004_seed.sql`.

### 2.1 Core user tables

- **`users`**
  - `user_id` (PK), `name`, `email` (UNIQUE), `password`, `role_id`.
  - Represents all application users.

- **`admins`**
  - `user_id` (PK, FK → `users.user_id`), `admin_level`.
  - Specialization of `users` for admin users.

- **`warehouse_staff`**
  - `user_id` (PK, FK → `users.user_id`), `job_title`, `shift`.
  - Specialization of `users` for warehouse staff.

### 2.2 Location and warehouse

- **`locations`**
  - `location_id` (PK), `location_name`, `location_type` (e.g. WAREHOUSE, PORT).

- **`warehouses`**
  - `warehouse_id` (PK), `name`, `address`, `capacity`, `location_id` (FK → `locations`).

- **`manages`**
  - `admin_user_id` (FK → `admins.user_id`), `warehouse_id` (FK → `warehouses.warehouse_id`).
  - Composite PK `(admin_user_id, warehouse_id)`.
  - Encodes “Admin MANAGES Warehouse”.

### 2.3 Cargo and inventory

- **`cargo_items`**
  - `cargo_id` (PK), `cargo_type`, `weight`.

- **`inventory_records`**
  - `cargo_id` (FK → `cargo_items.cargo_id`),
  - `warehouse_id` (FK → `warehouses.warehouse_id`),
  - `quantity_stored`, `last_updated`.
  - Composite PK `(cargo_id, warehouse_id)` – weak entity as per EERD.

### 2.4 Carriers, routes, shipments, containers

- **`carriers`**
  - `carrier_id` (PK), `name`, `carrier_type` (AIR / SEA / RAIL / etc.).

- **`routes`**
  - `route_id` (PK), `estimated_time` (e.g. in days or hours).

- **`shipments`**
  - `shipment_id` (PK), `shipment_date`, `status`,
  - `carrier_id` (FK → `carriers`),
  - `route_id` (FK → `routes`),
  - `origin_loc_id` (FK → `locations`),
  - `destination_loc_id` (FK → `locations`).

- **`containers`**
  - `container_id` (PK), `container_type`, `max_capacity`,
  - `shipment_id` (FK → `shipments`, nullable).
  - Models “Container ASSIGNED to Shipment (0,1)”.

- **`container_cargo`**
  - `cargo_id` (FK → `cargo_items`),
  - `container_id` (FK → `containers`),
  - Composite PK `(cargo_id, container_id)`.
  - Models “Container CONTAINS CargoItem (1,N vs 0,1)”.

### 2.5 Audit / logic / views

- **`audit_logs`**
  - `id`, `user_id`, `action_type`, `entity_type`, `entity_id`, `payload JSONB`, `created_at`.

- **Function `fn_audit_log(...)`**
  - Inserts a row into `audit_logs`.

- **Function `fn_update_inventory(p_cargo_id, p_warehouse_id, p_delta_quantity, p_staff_user_id)`**
  - Inserts or updates an `inventory_records` row.
  - Ensures quantity does not go negative.
  - Logs to `audit_logs` via `fn_audit_log`.

- **Trigger `trg_inventory_records_audit` on `inventory_records`**
  - After INSERT/UPDATE, calls `fn_audit_log` with new values.

- **View `view_shipment_summary`**
  - Joins `shipments`, `carriers`, `containers`, `container_cargo` for per‑shipment summary.

- **View `view_warehouse_inventory`**
  - Aggregates `inventory_records` + `cargo_items` to total units and total weight per warehouse.

## 3. Backend structure

### 3.1 DB connection

- **`lib/db.ts`**
  - Exposes `getPool()` which:
    - Reads `process.env.DATABASE_URL`.
    - Uses `pg.Pool` with `ssl: { rejectUnauthorized: false }`.
    - Reuses a single global pool in dev.

### 3.2 Setup scripts

- **`.env.local`**
  - Contains `DATABASE_URL=<Supabase Postgres URL>`.

- **`.env.example`**
  - Documents `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE`.

- **`scripts/db-setup.cjs`**
  - Loads `.env.local` with `dotenv`.
  - Applies SQL files in order:
    - `001_schema.sql`
    - `002_views.sql`
    - `003_functions_triggers.sql`
    - `004_seed.sql`
  - Script entry: `pnpm db:setup` (`"db:setup": "node scripts/db-setup.cjs"`).

### 3.3 API routes

- **`app/api/db/health/route.ts`**
  - Simple GET endpoint: executes `SELECT now(), version()` to verify DB connectivity.

Currently most page data access is **directly from server components**, not from separate API routes (simpler for this course, and keeps the SQL visible).

## 4. Frontend structure (Next.js app)

### 4.1 Layout & navigation

- **`app/layout.tsx`**
  - Global HTML shell, imports `app/globals.css`.

- **Components**
  - `components/layout/Sidebar.tsx`
    - SAP-like side navigation: Dashboard, Warehouses, Inventory, Shipments, Containers, Cargo Items, Carriers, Routes, Locations, Reports.
  - `components/layout/Topbar.tsx`
    - Top bar with app title and current user stub.
  - `components/dashboard/DashboardOverview.tsx`
    - KPI cards (currently static numbers, hints show intended SQL).

### 4.2 Pages (all shaped exactly to the DB schema)

All main entity pages are **server components** that query Supabase via `getPool()` using basic `SELECT` statements.

- **Dashboard** – `app/page.tsx`
  - Layout: `Sidebar + Topbar + DashboardOverview`.
  - Currently shows static KPIs but conceptually tied to:
    - COUNT of shipments by status.
    - COUNT of containers, cargo items, warehouses.

- **Warehouses** – `app/warehouses/page.tsx`
  - Query:  
    `SELECT warehouse_id, name, address, capacity, location_id FROM warehouses ORDER BY warehouse_id`.
  - Table columns mirror schema.

- **Shipments** – `app/shipments/page.tsx`
  - Query:  
    `SELECT shipment_id, status, shipment_date, carrier_id, route_id, origin_loc_id, destination_loc_id FROM shipments ORDER BY shipment_id`.
  - `shipment_date` rendered via `toLocaleString()` to handle Supabase date type.

- **Inventory** – `app/inventory/page.tsx`
  - Query:  
    `SELECT cargo_id, warehouse_id, quantity_stored, last_updated FROM inventory_records ORDER BY warehouse_id, cargo_id`.
  - Renders `last_updated` with `new Date(last_updated).toLocaleString()`.
  - UI buttons (not yet wired): “Adjust Quantity”, “Move to Container”.

- **Containers** – `app/containers/page.tsx`
  - Query:  
    `SELECT container_id, container_type, max_capacity, shipment_id FROM containers ORDER BY container_id`.

- **Cargo Items** – `app/cargo/page.tsx`
  - Query:  
    `SELECT cargo_id, cargo_type, weight FROM cargo_items ORDER BY cargo_id`.

- **Carriers** – `app/carriers/page.tsx`
  - Query:  
    `SELECT carrier_id, name, carrier_type FROM carriers ORDER BY carrier_id`.

- **Routes** – `app/routes/page.tsx`
  - Query:  
    `SELECT route_id, estimated_time FROM routes ORDER BY route_id`.

- **Locations** – `app/locations/page.tsx`
  - Query:  
    `SELECT location_id, location_name, location_type FROM locations ORDER BY location_id`.

- **Reports** – `app/reports/page.tsx`
  - Queries:
    - `view_warehouse_inventory` for warehouse totals.
    - `view_shipment_summary` for per-shipment aggregates.
  - Renders two compact tables:
    - Warehouse inventory summary (name, total units, total weight).
    - Shipment summary (status, carrier, container_count, cargo_item_count).

## 5. Planned features & enhancements

Below are features to make this a strong, database‑focused course project, all grounded in the existing schema.

### 5.1 Authentication and roles

**Goal**: Separate Admin and Warehouse Staff experiences, now using **Supabase Auth + our own `users`/role tables**.

#### 5.1.1 Current Supabase-based auth implementation

- **Supabase Auth**
  - Users authenticate via Supabase (email + password) using the project’s `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Supabase manages the auth cookies; we do **not** manually set `session` cookies anymore.

- **Link to our SQL schema**
  - We still keep all user/role data in our own tables:
    - `users` – `email` is used to match the Supabase user to our row.
    - `admins`, `warehouse_staff` – determine role via joins.

- **Core code**
  - `lib/supabase-browser.ts`
    - Exposes `createSupabaseBrowser()` which calls `createBrowserClient` from `@supabase/ssr` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - `lib/supabase-server.ts`
    - Exposes `createSupabaseServer()` which calls `createServerClient` from `@supabase/ssr` and wires it to Next.js cookies.
  - `lib/auth.ts`
    - `getCurrentUser()`:
      - Uses `createSupabaseServer()` and `supabase.auth.getUser()` to get the authenticated Supabase user.
      - Looks up that user’s `email` in our `users` table and LEFT JOINs `admins` / `warehouse_staff` to compute a role.
      - Returns `{ userId, name, email, role }` or `null` if not logged in.

- **Protected pages**
  - Home/dashboard (`app/page.tsx`) and all entity pages still call `await getCurrentUser()`:
    - If no user → `redirect("/login")`.
    - On admin-only pages, if `user.role !== "ADMIN"` → `redirect("/")`.

- **Login / logout UI**
  - `app/login/page.tsx`
    - Now a **client component** using the browser Supabase client.
    - Calls `supabase.auth.signInWithPassword({ email, password })` on submit, then redirects to `/` on success.
  - `components/layout/Topbar.tsx`
    - Now a **client component**.
    - Uses `createSupabaseBrowser()` and `supabase.auth.getUser()` in a `useEffect` to show the current user’s email.
    - “Sign out” button calls `supabase.auth.signOut()` and then `router.push("/login")`.
  - The old cookie-based routes `app/api/login/route.ts` and `app/api/logout/route.ts` have been removed.

#### 5.1.2 Role-based access control (unchanged conceptually)

- Admin (via `admins` specialization):
  - Full access to all entity pages, can manage (CRUD) warehouses, locations, carriers, routes, shipments, containers, and cargo items.
- Warehouse Staff (via `warehouse_staff` specialization):
  - Restricted to:
    - Viewing shipments, containers, cargo items (read-only metadata).
    - Managing inventory for their assigned warehouse(s).
    - Creating new `cargo_items` and updating `inventory_records` via course-approved SQL.
- Implementation:
  - Each server page checks `await getCurrentUser()` and enforces redirects based on the returned `role`.

### 5.2 Admin features

**User & role management**

- Admin UI to:
  - Create new users (insert into `users`, then into `admins` or `warehouse_staff`).
  - Assign/unassign admins to warehouses (`manages` table).
  - Assign staff to specific warehouses (could be extra field or through a view).

**Master data management**

- **Warehouses**:
  - CRUD for `warehouses`.
  - Enforce `capacity` as positive integer.
  - When deleting, protect against related `inventory_records` / `shipments`.

- **Locations**:
  - CRUD for `locations`.
  - Used as origin/destination in `shipments`.

- **Carriers**:
  - CRUD for `carriers` (name + type).

- **Routes**:
  - CRUD for `routes` (here only `estimated_time`, but could be extended).

**Shipment & container management**

- Create shipment:
  - Choose carrier, origin, destination, route, and date.
  - Insert into `shipments`.

- Assign containers to shipments:
  - Insert/update `containers.shipment_id`.
  - UI for listing available containers vs assigned.

- Assign cargo to containers:
  - Insert into `container_cargo`.
  - Optional: enforce capacity by summing `weight` of cargo assigned to each container.

### 5.3 Warehouse staff features

**Inventory workflow**

- **Adjust quantity**:
  - Button on Inventory page opens a form with:
    - `cargo_id`, `warehouse_id`, and `delta_quantity`.
  - Call `fn_update_inventory` via a simple route handler:
    - `SELECT fn_update_inventory($1, $2, $3, $4)` with staff user ID from session.
  - Show validation errors (e.g. negative quantity) from raised exceptions.

- **Move cargo to container**:
  - Staff select `cargo_id` + target `container_id`.
  - Insert into `container_cargo`.
  - Optionally run checks:
    - Confirm container belongs to a shipment.
    - Check capacity using `weight` and `max_capacity`.

**Cargo item creation**

- Simple form allowing staff to:
  - Insert into `cargo_items` with `cargo_type` and `weight`.
  - Optionally automatically add an `inventory_records` entry for their warehouse.

### 5.4 Reporting & advanced SQL

Leverage views and additional queries to show more complex database usage:

- **Container utilization report**
  - Based on `containers`, `container_cargo`, and `cargo_items`.
  - Show `% utilization` per container type using aggregation.

- **Carrier performance (conceptual)**
  - When/if arrival dates are tracked in `shipments`, compute average transit time per carrier.
  - Use `GROUP BY carrier_id` and date arithmetic.

- **Warehouse capacity vs usage**
  - Join `warehouses` with `view_warehouse_inventory`.
  - Show total weight vs `capacity`, highlight warehouses nearing capacity.

All of these should be implemented as pure SQL queries (or extra views) and then displayed in the `Reports` page.

### 5.5 UI/UX polish (still database-aligned)

- **Filtering & sorting** on list pages:
  - E.g. filter shipments by status, warehouse by location, etc.
  - Use query parameters and `WHERE` clauses, avoid client-only filtering to highlight SQL.

- **Pagination for large tables**
  - Apply `LIMIT/OFFSET` in queries for shipments, inventory, etc.

- **Error handling**
  - Display clear error messages when SQL operations fail (e.g. violating constraints).

## 6. How to run the project

- **Setup database** (after configuring `DATABASE_URL` in `.env.local`):

```bash
pnpm db:setup
```

- **Run the app in development**:

```bash
pnpm dev
```

Then open `http://localhost:3000` to access the dashboard and all entity pages.

This `context.md` should make it straightforward for teammates, TAs, or future you to understand the current structure and the roadmap for turning this into a complete, database-centric freight management system with clear role-based functionality.

