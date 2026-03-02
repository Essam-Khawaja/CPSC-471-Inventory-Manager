# Database Setup Guide
## Freight Cargo Inventory & Shipment Management System
### CPSC 471 W26 — Group G-4

---

## Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name**: anything you like (e.g. `freight-cargo-471`)
   - **Database password**: pick a strong one — **save this, you'll need it**

---

## Step 2 — Get Your Connection String

1. In your Supabase dashboard, go to **Project Settings → Database**
2. Scroll down to **Connection string**
3. Make sure you are on the **URI** tab
4. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you set in Step 1

---

## Step 3 — Configure Your Environment

In the **root of the demo folder**, create a file called `.env.local`:

```
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

> ⚠️ **Do not wrap the value in quotes.** The line must start directly with `postgresql://`

Your `.env.local` should look exactly like this (with your own values):
```
SUPABASE_DB_URL=postgresql://postgres:Abc123!@db.abcdefghijkl.supabase.co:5432/postgres
```

---

## Step 4 — Install Dependencies

```bash
npm install
```

---

## Step 5 — Set Up the Database

Run all three steps in order:

```bash
npm run db:generate   # generates migration files from schema.ts
npm run db:migrate    # applies migrations to your Supabase database
npm run db:seed       # inserts sample data
```

Or run everything at once:

```bash
npm run db:setup
```

### What gets created

| Table             | Description                                  |
|-------------------|----------------------------------------------|
| `location`        | Cities / ports used by warehouses & shipments |
| `route`           | Routes with estimated transit times           |
| `carrier`         | Shipping carriers (Maersk, MSC, etc.)         |
| `user`            | All system users (base entity)                |
| `admin`           | Admin specialisation of user                 |
| `warehouse_staff` | Warehouse staff specialisation of user        |
| `warehouse`       | Warehouses linked to locations                |
| `manages`         | Admin ↔ Warehouse assignments                 |
| `cargo_item`      | Individual cargo items                        |
| `inventory_record`| Cargo quantities per warehouse (weak entity)  |
| `shipment`        | Shipments between locations                   |
| `container`       | Containers assigned to shipments              |
| `container_cargo` | Cargo items loaded into containers            |

### Sample data included

- 5 warehouses across the US
- 7 shipments in various statuses
- 8 containers (some assigned, some available)
- 10 cargo items across different types
- 6 users (2 admins, 4 warehouse staff)

---

## Step 6 — Verify It Worked

Open Drizzle Studio to visually browse your database:

```bash
npm run db:studio
```

This opens a browser UI at `https://local.drizzle.studio` where you can inspect all tables and rows.

Alternatively check the **Table Editor** in your Supabase dashboard.

---

## Available Scripts

| Command           | Description                                        |
|-------------------|----------------------------------------------------|
| `npm run db:generate`| Generate migration files from `lib/db/schema.ts`   |
| `npm run db:migrate` | Apply pending migrations to Supabase               |
| `npm run db:seed`    | Wipe and reseed all sample data                    |
| `npm run db:setup`   | generate + migrate + seed in one command           |
| `npm run db:studio`  | Open Drizzle Studio to browse the database         |

---

## Project Structure

```
demo/
├── lib/
│   └── db/
│       ├── schema.ts      ← Drizzle schema (source of truth for all types)
│       └── index.ts       ← DB client (import this in your API routes)
├── scripts/
│   └── seed.ts            ← Seeds sample data
├── drizzle/               ← Auto-generated migration files (do not edit)
├── drizzle.config.ts      ← Drizzle Kit config
└── .env.local             ← Your local secrets (never commit this)
```
