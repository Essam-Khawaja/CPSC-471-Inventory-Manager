BEGIN;

CREATE SCHEMA IF NOT EXISTS freight;
SET search_path = freight, public;

CREATE OR REPLACE VIEW view_shipment_summary AS
SELECT
  s.id as shipment_id,
  s.shipment_code,
  s.status,
  s.departure_date,
  s.arrival_date,
  c.name as carrier_name,
  r.route_code,
  lo.name as origin_name,
  ld.name as destination_name,
  COUNT(DISTINCT ct.id) FILTER (WHERE ct.current_shipment_id = s.id) as container_count,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.container_id = ct.id) as cargo_item_count
FROM shipments s
JOIN carriers c ON c.id = s.carrier_id
JOIN routes r ON r.id = s.route_id
JOIN locations lo ON lo.id = r.origin_location_id
JOIN locations ld ON ld.id = r.destination_location_id
LEFT JOIN containers ct ON ct.current_shipment_id = s.id
LEFT JOIN cargo_items ci ON ci.container_id = ct.id
GROUP BY
  s.id, c.name, r.route_code, lo.name, ld.name;

CREATE OR REPLACE VIEW view_warehouse_inventory AS
SELECT
  w.id as warehouse_id,
  w.code as warehouse_code,
  w.name as warehouse_name,
  SUM(ir.quantity) as total_units,
  SUM(ir.quantity * COALESCE(ci.weight_kg, 0)) as total_weight_kg
FROM warehouses w
LEFT JOIN inventory_records ir ON ir.warehouse_id = w.id
LEFT JOIN cargo_items ci ON ci.id = ir.cargo_id
GROUP BY w.id, w.code, w.name;

COMMIT;

