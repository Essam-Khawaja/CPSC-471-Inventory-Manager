BEGIN;

-- Minimal seed data (safe to re-run with ON CONFLICT)

INSERT INTO users(name, email, password, role_id)
VALUES
  ('Admin User', 'admin@example.com', 'dev-only', 1),
  ('Staff One', 'staff1@example.com', 'dev-only', 2),
  ('Staff Two', 'staff2@example.com', 'dev-only', 2)
ON CONFLICT (email) DO NOTHING;

INSERT INTO admins(user_id, admin_level)
SELECT user_id, 1
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO warehouse_staff(user_id, job_title, shift)
SELECT user_id, 'Warehouse Operator', 'Day'
FROM users
WHERE email IN ('staff1@example.com', 'staff2@example.com')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO locations(location_name, location_type)
VALUES
  ('Calgary Main Warehouse', 'WAREHOUSE'),
  ('Vancouver Port Terminal', 'PORT'),
  ('Toronto Distribution', 'WAREHOUSE'),
  ('Tokyo Port Terminal', 'PORT')
ON CONFLICT DO NOTHING;

INSERT INTO warehouses(name, address, capacity, location_id)
VALUES
  (
    'Calgary Main',
    'Calgary, AB',
    1000,
    (SELECT location_id FROM locations WHERE location_name = 'Calgary Main Warehouse' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

INSERT INTO manages(admin_user_id, warehouse_id)
VALUES
  (
    (SELECT user_id FROM admins LIMIT 1),
    (SELECT warehouse_id FROM warehouses WHERE name = 'Calgary Main' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

INSERT INTO carriers(name, carrier_type)
VALUES
  ('AirFast', 'AIR'),
  ('SeaBridge', 'SEA'),
  ('RailConnect', 'RAIL')
ON CONFLICT DO NOTHING;

INSERT INTO routes(estimated_time)
VALUES (2), (9)
ON CONFLICT DO NOTHING;

INSERT INTO shipments(shipment_date, status, carrier_id, route_id, origin_loc_id, destination_loc_id)
VALUES
  (
    CURRENT_DATE,
    'IN_TRANSIT',
    (SELECT carrier_id FROM carriers WHERE name = 'AirFast' LIMIT 1),
    (SELECT route_id FROM routes ORDER BY route_id LIMIT 1),
    (SELECT location_id FROM locations WHERE location_name = 'Calgary Main Warehouse' LIMIT 1),
    (SELECT location_id FROM locations WHERE location_name = 'Toronto Distribution' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

INSERT INTO containers(container_type, max_capacity, shipment_id)
VALUES
  ('40ft Dry', 28000, (SELECT shipment_id FROM shipments LIMIT 1)),
  ('20ft Reefer', 18000, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO cargo_items(cargo_type, weight)
VALUES
  ('Consumer Electronics', 12000),
  ('Textiles Roll', 5000)
ON CONFLICT DO NOTHING;

INSERT INTO container_cargo(cargo_id, container_id)
VALUES
  (
    (SELECT cargo_id FROM cargo_items WHERE cargo_type = 'Consumer Electronics' LIMIT 1),
    (SELECT container_id FROM containers WHERE container_type = '40ft Dry' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

INSERT INTO inventory_records(cargo_id, warehouse_id, quantity_stored, last_updated)
VALUES
  (
    (SELECT cargo_id FROM cargo_items WHERE cargo_type = 'Consumer Electronics' LIMIT 1),
    (SELECT warehouse_id FROM warehouses WHERE name = 'Calgary Main' LIMIT 1),
    10,
    NOW()
  ),
  (
    (SELECT cargo_id FROM cargo_items WHERE cargo_type = 'Textiles Roll' LIMIT 1),
    (SELECT warehouse_id FROM warehouses WHERE name = 'Calgary Main' LIMIT 1),
    22,
    NOW()
  )
ON CONFLICT (cargo_id, warehouse_id) DO UPDATE SET
  quantity_stored = EXCLUDED.quantity_stored,
  last_updated = NOW();

COMMIT;

