BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT NULL,
  payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_audit_log(
  p_user_id BIGINT,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id BIGINT,
  p_payload JSONB
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, payload)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_payload);
END;
$$;

CREATE OR REPLACE FUNCTION fn_update_inventory(
  p_cargo_id BIGINT,
  p_warehouse_id BIGINT,
  p_delta_quantity INTEGER,
  p_staff_user_id BIGINT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_qty INTEGER;
BEGIN
  INSERT INTO inventory_records(cargo_id, warehouse_id, quantity_stored, last_updated)
  VALUES (p_cargo_id, p_warehouse_id, GREATEST(p_delta_quantity, 0), NOW())
  ON CONFLICT (cargo_id, warehouse_id)
  DO UPDATE SET
    quantity_stored = inventory_records.quantity_stored + p_delta_quantity,
    last_updated = NOW()
  RETURNING quantity_stored INTO v_new_qty;

  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Inventory quantity cannot be negative (warehouse_id=%, cargo_id=%)', p_warehouse_id, p_cargo_id;
  END IF;

  PERFORM fn_audit_log(
    p_staff_user_id,
    'INVENTORY_ADJUST',
    'inventory_records',
    NULL,
    JSONB_BUILD_OBJECT(
      'warehouse_id', p_warehouse_id,
      'cargo_id', p_cargo_id,
      'delta_quantity', p_delta_quantity,
      'new_quantity', v_new_qty
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION trg_inventory_records_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM fn_audit_log(
    NULL,
    CASE WHEN TG_OP = 'INSERT' THEN 'INSERT' ELSE 'UPDATE' END,
    'inventory_records',
    NULL,
    JSONB_BUILD_OBJECT(
      'warehouse_id', NEW.warehouse_id,
      'cargo_id', NEW.cargo_id,
      'quantity_stored', NEW.quantity_stored
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventory_records_audit ON inventory_records;
CREATE TRIGGER inventory_records_audit
AFTER INSERT OR UPDATE ON inventory_records
FOR EACH ROW EXECUTE FUNCTION trg_inventory_records_audit();

COMMIT;

