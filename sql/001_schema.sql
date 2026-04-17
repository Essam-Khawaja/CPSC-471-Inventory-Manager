-- Freight Cargo Inventory and Shipment Management System
-- Core relational schema based on the project EERD

BEGIN;

-- Users table: all application users identified by email
CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role_id INTEGER NOT NULL CHECK (role_id IN (1, 2))
);

-- Admins: specialization of users for admin-level users
CREATE TABLE IF NOT EXISTS admins (
  user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  admin_level INTEGER NOT NULL
);

-- Warehouse staff: specialization of users for warehouse workers
CREATE TABLE IF NOT EXISTS warehouse_staff (
  user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  shift TEXT NOT NULL
);

-- Locations: origin/destination points for shipments (warehouses, ports, etc.)
CREATE TABLE IF NOT EXISTS locations (
  location_id BIGSERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL
);

-- Warehouses: storage facilities linked to a location
CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Manages: many-to-many relationship between admins and warehouses they oversee
CREATE TABLE IF NOT EXISTS manages (
  admin_user_id BIGINT NOT NULL REFERENCES admins(user_id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
  PRIMARY KEY (admin_user_id, warehouse_id)
);

-- Cargo items: individual types of freight with a unit weight
CREATE TABLE IF NOT EXISTS cargo_items (
  cargo_id BIGSERIAL PRIMARY KEY,
  cargo_type TEXT NOT NULL,
  weight NUMERIC(12,2) NOT NULL CHECK (weight > 0)
);

-- Inventory records: tracks quantity of each cargo item stored at each warehouse
-- Weak entity with composite PK (cargo_id, warehouse_id)
CREATE TABLE IF NOT EXISTS inventory_records (
  cargo_id BIGINT NOT NULL REFERENCES cargo_items(cargo_id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
  quantity_stored INTEGER NOT NULL CHECK (quantity_stored >= 0),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cargo_id, warehouse_id)
);

-- Carriers: external transport companies (air, sea, rail, etc.)
CREATE TABLE IF NOT EXISTS carriers (
  carrier_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  carrier_type TEXT NOT NULL
);

-- Routes: predefined shipment routes with estimated transit time
CREATE TABLE IF NOT EXISTS routes (
  route_id BIGSERIAL PRIMARY KEY,
  estimated_time INTEGER NOT NULL
);

-- Shipments: a single freight movement from origin to destination
CREATE TABLE IF NOT EXISTS shipments (
  shipment_id BIGSERIAL PRIMARY KEY,
  shipment_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
  carrier_id BIGINT NOT NULL REFERENCES carriers(carrier_id) ON DELETE RESTRICT,
  route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE RESTRICT,
  origin_loc_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
  destination_loc_id BIGINT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT
);

-- Containers: physical containers that can be assigned to a shipment
CREATE TABLE IF NOT EXISTS containers (
  container_id BIGSERIAL PRIMARY KEY,
  container_type TEXT NOT NULL,
  max_capacity NUMERIC(12,2) NOT NULL CHECK (max_capacity > 0),
  shipment_id BIGINT NULL REFERENCES shipments(shipment_id) ON DELETE SET NULL
);

-- Container cargo: associative table linking cargo items to containers
CREATE TABLE IF NOT EXISTS container_cargo (
  cargo_id BIGINT NOT NULL REFERENCES cargo_items(cargo_id) ON DELETE CASCADE,
  container_id BIGINT NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
  PRIMARY KEY (cargo_id, container_id)
);

-- Staff → warehouse assignment (added after warehouses exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warehouse_staff' AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE warehouse_staff
      ADD COLUMN warehouse_id BIGINT NULL REFERENCES warehouses(warehouse_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for common lookup paths
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_records(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_containers_shipment ON containers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_staff_warehouse ON warehouse_staff(warehouse_id);

COMMIT;
