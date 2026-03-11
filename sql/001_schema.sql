-- Freight Cargo Inventory and Shipment Management System
-- PostgreSQL schema (SQL-first; designed for Supabase Postgres or local Postgres)

BEGIN;

CREATE SCHEMA IF NOT EXISTS freight;
SET search_path = freight, public;

-- Enums kept as text + CHECK constraints (portable + explicit SQL)

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  warehouse_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_chk CHECK (role IN ('ADMIN', 'STAFF'))
);

CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location_text TEXT NOT NULL,
  admin_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT users_warehouse_fk
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS carriers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_email TEXT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carriers_status_chk CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL,
  city TEXT NULL,
  country_code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT locations_type_chk CHECK (location_type IN ('WAREHOUSE', 'PORT', 'AIRPORT', 'RAIL_YARD', 'CUSTOMER', 'OTHER'))
);

CREATE TABLE IF NOT EXISTS routes (
  id BIGSERIAL PRIMARY KEY,
  route_code TEXT NOT NULL UNIQUE,
  origin_location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  destination_location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  estimated_days INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routes_origin_dest_chk CHECK (origin_location_id <> destination_location_id)
);

CREATE TABLE IF NOT EXISTS shipments (
  id BIGSERIAL PRIMARY KEY,
  shipment_code TEXT NOT NULL UNIQUE,
  carrier_id BIGINT NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
  created_by_admin_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  departure_date DATE NULL,
  arrival_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shipments_status_chk CHECK (status IN ('PLANNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS containers (
  id BIGSERIAL PRIMARY KEY,
  container_code TEXT NOT NULL UNIQUE,
  container_type TEXT NOT NULL,
  capacity_weight_kg NUMERIC(12,2) NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  current_shipment_id BIGINT NULL REFERENCES shipments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT containers_status_chk CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE'))
);

CREATE TABLE IF NOT EXISTS cargo_items (
  id BIGSERIAL PRIMARY KEY,
  cargo_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  weight_kg NUMERIC(12,2) NULL,
  volume_m3 NUMERIC(12,3) NULL,
  owner_name TEXT NULL,
  status TEXT NOT NULL DEFAULT 'IN_WAREHOUSE',
  container_id BIGINT NULL REFERENCES containers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cargo_status_chk CHECK (status IN ('IN_WAREHOUSE', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'))
);

-- Weak entity: InventoryRecord identified by (warehouse_id, cargo_id)
CREATE TABLE IF NOT EXISTS inventory_records (
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  cargo_id BIGINT NOT NULL REFERENCES cargo_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0,
  location_in_warehouse TEXT NULL,
  last_updated_by_staff_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (warehouse_id, cargo_id),
  CONSTRAINT inventory_qty_chk CHECK (quantity >= 0)
);

-- Useful indexes for reporting and filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_warehouse_id ON users(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_records(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_containers_current_shipment ON containers(current_shipment_id);
CREATE INDEX IF NOT EXISTS idx_cargo_container ON cargo_items(container_id);

COMMIT;

