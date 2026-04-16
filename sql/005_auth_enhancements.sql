-- Auth enhancements: adds account lifecycle and admin promotion request table.

BEGIN;

-- Account lifecycle: pending_registration -> active / rejected / disabled
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

-- Drop auth_user_id if it was added previously (we use email matching only)
ALTER TABLE users DROP COLUMN IF EXISTS auth_user_id;

-- Table for staff-to-admin promotion requests
CREATE TABLE IF NOT EXISTS admin_access_requests (
  request_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL,
  resolved_by_user_id BIGINT NULL REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_user ON admin_access_requests(user_id);

-- Staff5 (Emily Zhang) is a newly registered user awaiting approval
UPDATE users SET account_status = 'pending_registration'
WHERE email = 'staff5@example.com' AND account_status = 'active';

-- Staff1 and Staff2 have requested admin access
INSERT INTO admin_access_requests (user_id, reason)
SELECT user_id, 'I have been managing Calgary Central Warehouse inventory for 6 months and need admin access to approve shipments and manage staff assignments.'
FROM users WHERE email = 'staff1@example.com'
AND NOT EXISTS (SELECT 1 FROM admin_access_requests WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff1@example.com'));

INSERT INTO admin_access_requests (user_id, reason)
SELECT user_id, 'Promoted to shift lead at Vancouver Logistics Park. Need admin privileges to handle carrier onboarding and route management.'
FROM users WHERE email = 'staff2@example.com'
AND NOT EXISTS (SELECT 1 FROM admin_access_requests WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff2@example.com'));

COMMIT;
