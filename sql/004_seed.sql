BEGIN;

CREATE SCHEMA IF NOT EXISTS freight;
SET search_path = freight, public;

-- Minimal seed data (safe to re-run with ON CONFLICT)

INSERT INTO users(full_name, email, role, password_hash)
VALUES
  ('Admin User', 'admin@example.com', 'ADMIN', 'dev-only'),
  ('Staff One', 'staff1@example.com', 'STAFF', 'dev-only'),
  ('Staff Two', 'staff2@example.com', 'STAFF', 'dev-only')
ON CONFLICT (email) DO NOTHING;

INSERT INTO carriers(name, contact_email, status)
VALUES
  ('AirFast', 'ops@airfast.com', 'ACTIVE'),
  ('SeaBridge', 'support@seabridge.com', 'ACTIVE'),
  ('RailConnect', 'dispatch@railconnect.com', 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

INSERT INTO locations(name, location_type, city, country_code)
VALUES
  ('Calgary Main Warehouse', 'WAREHOUSE', 'Calgary', 'CA'),
  ('Vancouver Port Terminal', 'PORT', 'Vancouver', 'CA'),
  ('Toronto Distribution', 'WAREHOUSE', 'Toronto', 'CA'),
  ('Tokyo Port Terminal', 'PORT', 'Tokyo', 'JP')
ON CONFLICT DO NOTHING;

-- Warehouses require admin_user_id; pick the first admin
WITH admin AS (
  SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1
)
INSERT INTO warehouses(code, name, location_text, admin_user_id)
SELECT 'WH-01', 'Calgary Main', 'Calgary, AB', admin.id FROM admin
ON CONFLICT (code) DO NOTHING;

-- Assign staff to warehouse
UPDATE users
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH-01')
WHERE role = 'STAFF' AND warehouse_id IS NULL;

-- Routes
INSERT INTO routes(route_code, origin_location_id, destination_location_id, estimated_days)
VALUES
  (
    'RT-CA-TO',
    (SELECT id FROM locations WHERE name = 'Calgary Main Warehouse' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Toronto Distribution' LIMIT 1),
    2
  ),
  (
    'RT-VA-TK',
    (SELECT id FROM locations WHERE name = 'Vancouver Port Terminal' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Tokyo Port Terminal' LIMIT 1),
    9
  )
ON CONFLICT (route_code) DO NOTHING;

-- Containers
INSERT INTO containers(container_code, container_type, capacity_weight_kg, status)
VALUES
  ('CONT-001', '40ft Dry', 28000, 'IN_USE'),
  ('CONT-014', '20ft Reefer', 18000, 'AVAILABLE')
ON CONFLICT (container_code) DO NOTHING;

-- Cargo
INSERT INTO cargo_items(cargo_code, description, weight_kg, status)
VALUES
  ('CARGO-001', 'Consumer Electronics', 12000, 'IN_WAREHOUSE'),
  ('CARGO-045', 'Textiles Roll', 5000, 'IN_WAREHOUSE')
ON CONFLICT (cargo_code) DO NOTHING;

-- Inventory records (weak entity)
INSERT INTO inventory_records(warehouse_id, cargo_id, quantity, location_in_warehouse, last_updated_by_staff_user_id)
VALUES
  (
    (SELECT id FROM warehouses WHERE code = 'WH-01' LIMIT 1),
    (SELECT id FROM cargo_items WHERE cargo_code = 'CARGO-001' LIMIT 1),
    10,
    'Aisle 03 · Bin 12',
    (SELECT id FROM users WHERE email = 'staff1@example.com' LIMIT 1)
  ),
  (
    (SELECT id FROM warehouses WHERE code = 'WH-01' LIMIT 1),
    (SELECT id FROM cargo_items WHERE cargo_code = 'CARGO-045' LIMIT 1),
    22,
    'Aisle 07 · Bin 04',
    (SELECT id FROM users WHERE email = 'staff2@example.com' LIMIT 1)
  )
ON CONFLICT (warehouse_id, cargo_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  location_in_warehouse = EXCLUDED.location_in_warehouse,
  last_updated_by_staff_user_id = EXCLUDED.last_updated_by_staff_user_id,
  last_updated_at = NOW();

COMMIT;

