-- Database views for aggregated reporting

BEGIN;

-- Shipment summary: joins shipments with carriers, routes, and counts containers/cargo
CREATE OR REPLACE VIEW view_shipment_summary AS
SELECT
  s.shipment_id,
  s.status,
  s.shipment_date,
  c.name AS carrier_name,
  r.route_id,
  s.origin_loc_id,
  s.destination_loc_id,
  COUNT(DISTINCT ct.container_id) AS container_count,
  COUNT(DISTINCT cc.cargo_id) AS cargo_item_count
FROM shipments s
JOIN carriers c ON c.carrier_id = s.carrier_id
JOIN routes r ON r.route_id = s.route_id
LEFT JOIN containers ct ON ct.shipment_id = s.shipment_id
LEFT JOIN container_cargo cc ON cc.container_id = ct.container_id
GROUP BY
  s.shipment_id, s.status, s.shipment_date,
  c.name, r.route_id, s.origin_loc_id, s.destination_loc_id;

-- Warehouse inventory: aggregates total units and weight per warehouse
CREATE OR REPLACE VIEW view_warehouse_inventory AS
SELECT
  w.warehouse_id,
  w.name AS warehouse_name,
  SUM(ir.quantity_stored) AS total_units,
  SUM(ir.quantity_stored * COALESCE(ci.weight, 0)) AS total_weight
FROM warehouses w
LEFT JOIN inventory_records ir ON ir.warehouse_id = w.warehouse_id
LEFT JOIN cargo_items ci ON ci.cargo_id = ir.cargo_id
GROUP BY w.warehouse_id, w.name;

COMMIT;
