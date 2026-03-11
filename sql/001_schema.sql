-- Freight Cargo Inventory and Shipment Management System
-- Relational schema based on provided diagram

BEGIN;

-- Core user and specialization tables

CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  admin_level INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouse_staff (
  user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  shift TEXT NOT NULL
);

-- Location and warehouse tables

CREATE TABLE IF NOT EXISTS locations (
  location_id BIGSERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  location_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Relationship: Admin MANAGES Warehouse

CREATE TABLE IF NOT EXISTS manages (
  admin_user_id BIGINT NOT NULL REFERENCES admins(user_id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  PRIMARY KEY (admin_user_id, warehouse_id)
);

-- Cargo and inventory tables

CREATE TABLE IF NOT EXISTS cargo_items (
  cargo_id BIGSERIAL PRIMARY KEY,
  cargo_type TEXT NOT NULL,
  weight NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_records (
  cargo_id BIGINT NOT NULL REFERENCES cargo_items(cargo_id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
  quantity_stored INTEGER NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cargo_id, warehouse_id)
);

-- Carrier and route tables

CREATE TABLE IF NOT EXISTS carriers (
  carrier_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  carrier_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
  route_id BIGSERIAL PRIMARY KEY,
  estimated_time INTEGER NOT NULL
);

-- Shipment and container tables

CREATE TABLE IF NOT EXISTS shipments (
  shipment_id BIGSERIAL PRIMARY KEY,
  shipment_date DATE NOT NULL,
  status TEXT NOT NULL,
  carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE RESTRICT,
  route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE RESTRICT,
  origin_loc_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
  destination_loc_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS containers (
  container_id BIGSERIAL PRIMARY KEY,
  container_type TEXT NOT NULL,
  max_capacity NUMERIC(12,2) NOT NULL,
  shipment_id BIGINT NULL REFERENCES shipments(shipment_id) ON DELETE SET NULL
);

-- Relationship: Container CONTAINS CargoItem (through associative table)

CREATE TABLE IF NOT EXISTS container_cargo (
  cargo_id BIGINT NOT NULL REFERENCES cargo_items(cargo_id) ON DELETE CASCADE,
  container_id BIGINT NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
  PRIMARY KEY (cargo_id, container_id)
);

-- Indexes for common lookup paths

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_records(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_containers_shipment ON containers(shipment_id);

COMMIT;

