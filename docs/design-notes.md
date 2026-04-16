# Design Notes - Diagram Reference Guide

**Freight Cargo Inventory and Shipment Management System**
CPSC 471 W26 - Group G-4

This document explains each diagram in the `docs/` folder, what it represents, and how it relates to the final implemented system.

Archived course deliverables and earlier working diagrams are kept in `docs/old-docs/`. That folder includes the proposal and progress report PDFs, along with the earlier `Prog1.drawio` and `Prog2v2.drawio` diagram files.

---

## 1. EERD - Enhanced Entity-Relationship Diagram (Final)

**Files:** `docs/RM&EERD/EERD.drawio` (draw.io) and `docs/plantuml/EERD.puml` (PlantUML)

This is the final Enhanced Entity-Relationship Diagram reflecting the implemented database. Open it in [draw.io](https://app.diagrams.net/) or any compatible editor.

**Entities (strong):**

- **User** - supertype with attributes: user_id (PK), name, email, password, role_id, account_status
- **Admin** - specialization of User with: admin_level
- **Warehouse Staff** - specialization of User with: job_title, shift
- **Warehouse** - warehouse_id (PK), name, address, capacity
- **Location** - location_id (PK), location_name, location_type
- **CargoItem** - cargo_id (PK), cargo_type, weight
- **Carrier** - carrier_id (PK), name, carrier_type
- **Route** - route_id (PK), estimated_time
- **Shipment** - shipment_id (PK), shipment_date, status
- **Container** - container_id (PK), container_type, max_capacity

**Weak entity:**

- **InventoryRecord** - composite PK (cargo_id, warehouse_id), quantity_stored, last_updated

**Entities added post-proposal (shown in purple):**

- **AdminAccessRequest** - request_id (PK), user_id (FK), reason, status, requested_at, resolved_at, resolved_by_user_id
- **AuditLog** - id (PK), user_id (FK nullable), action_type, entity_type, entity_id, payload (JSONB), created_at

**Relationships and their cardinalities:**

| Relationship      | Between                              | Cardinality          |
| ----------------- | ------------------------------------ | -------------------- |
| ISA (disjoint)    | User -> Admin, WarehouseStaff        | Total specialization |
| MANAGES           | Admin -> Warehouse                   | (0,N) to (1,1)       |
| WORKS_AT          | WarehouseStaff -> Warehouse          | (1,1) to (1,N)       |
| CREATES           | Admin -> Shipment                    | (1,N) to (1,1)       |
| UPDATES           | WarehouseStaff -> InventoryRecord    | (0,N) to (0,N)       |
| LOCATED_AT        | Warehouse -> Location                | (1,1) to (0,N)       |
| STORES            | Warehouse -> InventoryRecord         | (1,N)                |
| TRACKS            | InventoryRecord -> CargoItem         | (1,1) to (0,N)       |
| HANDLED_BY        | Carrier -> Shipment                  | (0,N) to (1,1)       |
| USES              | Route -> Shipment                    | (0,N) to (1,1)       |
| DELIVERED TO/FROM | Location -> Shipment                 | (0,N) to (1,2)       |
| ASSIGNED          | Shipment -> Container                | (1,N) to (0,1)       |
| CONTAINS          | Container -> CargoItem               | (1,N) to (0,1)       |
| REQUESTS          | WarehouseStaff -> AdminAccessRequest | New                  |

**Changes from Prog1 EERD:**

- Added `account_status` attribute to User for registration lifecycle
- Added AdminAccessRequest entity and REQUESTS relationship
- Added AuditLog entity with dashed link to User (optional FK)
- Corrected InventoryRecord to show double-border (weak entity notation)
- Added warehouse_id FK on WarehouseStaff for direct assignment

---

## 2. RelationalModel - Relational Model Diagram (Final)

**Files:** `docs/RM&EERD/RelationalModel.drawio` (draw.io) and `docs/plantuml/RelationalModel.puml` (PlantUML)

This diagram shows each relation (table) with its columns. Underlined columns are primary keys; (FK) marks foreign keys. Purple-colored tables indicate relations that were added during implementation and were not in the original proposal.

**All 15 relations:**

1. **User** (user_id, name, email, password, role_id, account_status)
2. **Admin** (user_id [PK, FK -> User])
3. **WarehouseStaff** (user_id [PK, FK -> User], job_title, shift, warehouse_id [FK -> Warehouse, nullable])
4. **Manages** (admin_user_id [PK, FK -> Admin], warehouse_id [PK, FK -> Warehouse])
5. **Warehouse** (warehouse_id, name, address, capacity, location_id [FK -> Location])
6. **Location** (location_id, location_name, location_type)
7. **CargoItem** (cargo_id, cargo_type, weight)
8. **InventoryRecord** (cargo_id [PK, FK -> CargoItem], warehouse_id [PK, FK -> Warehouse], quantity_stored, last_updated)
9. **Carrier** (carrier_id, name, carrier_type)
10. **Route** (route_id, estimated_time)
11. **Shipment** (shipment_id, shipment_date, status, carrier_id [FK], route_id [FK], origin_loc_id [FK], destination_loc_id [FK])
12. **Container** (container_id, container_type, max_capacity, shipment_id [FK, nullable])
13. **ContainerCargo** (cargo_id [PK, FK], container_id [PK, FK])
14. **AuditLog** (id, user_id [FK, nullable], action_type, entity_type, entity_id, payload, created_at)
15. **AdminAccessRequest** (request_id, user_id [FK], reason, status, requested_at, resolved_at, resolved_by_user_id [FK, nullable])

**Changes from Prog2 RM:**

- Added `account_status` column to User
- Added `warehouse_id` column to WarehouseStaff
- Added `role_id` column to User (was implicit in Prog2)
- Added AuditLog and AdminAccessRequest as entirely new relations

---

## 3. schema_complete.puml - Complete Database Schema (PlantUML)

**File:** `docs/plantuml/schema_complete.puml`

A PlantUML class diagram that mirrors the database schema with all tables, columns, data types, primary keys, foreign keys, and relationship multiplicities. This is the most detailed schema diagram and includes notes on:

- The weak entity (InventoryRecord) with its composite PK
- The stored function `fn_update_inventory()` that manages inventory
- The trigger `trg_inventory_records_audit` that fires on inventory changes
- Shipment status values (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)

---

## 4. auth_flow.puml - Authentication and Authorization Flow

**File:** `docs/plantuml/auth_flow.puml`

A sequence diagram showing the complete authentication flow:

1. **Registration** - user self-registers, Supabase Auth account created, application user row inserted with pending status
2. **Login** - Supabase verifies credentials, `getCurrentUser()` resolves role from SQL JOINs, routes based on account status
3. **Authenticated page request** - how each page load checks auth and enforces role restrictions
4. **Staff requests admin** - the promotion request workflow
5. **Admin approves promotion** - the SQL operations that convert a staff user to admin

---

## 5. architecture_overview.puml - System Architecture

**File:** `docs/plantuml/architecture_overview.puml`

A component diagram showing the three-tier architecture:

- **Browser layer** - React 19 client components, Supabase browser client for auth
- **Server layer** - Next.js 15 App Router with server components, API routes, and library modules (auth.ts, db.ts, supabase-server.ts)
- **Database layer** - Supabase PostgreSQL with public schema tables, auth schema, stored functions, triggers, and views

Key architectural points highlighted:

- All data access uses direct SQL via pg Pool (no ORM)
- All queries are parameterized ($1, $2, ...) for SQL injection prevention
- Auth cookies managed by Supabase SSR, role resolution done via SQL JOINs

---

## 6. user_lifecycle.puml - User Lifecycle State Machine

**File:** `docs/plantuml/user_lifecycle.puml`

A state diagram showing all possible states a user can be in:

- **PendingRegistration** - initial state after self-registration
- **Active (Staff)** - default active role
- **Active (Admin)** - promoted staff or created by admin
- **RequestedAdmin** - staff who has submitted a promotion request
- **Rejected** - registration rejected by admin

Transitions include: admin approval, admin rejection, promotion request, promotion approval/rejection, demotion (requires DEMOTION_KEY).

---

## 7. inventory_flow.puml - Inventory Adjustment and Audit Trail

**File:** `docs/plantuml/inventory_flow.puml`

A sequence diagram detailing the inventory adjustment process:

1. User clicks "Adjust Quantity" on the inventory page
2. Server action calls `fn_update_inventory()` stored function
3. Function performs UPSERT on inventory_records using `ON CONFLICT`
4. If quantity would go negative, function raises an exception
5. On success, function calls `fn_audit_log()` to record the change
6. Independently, the `trg_inventory_records_audit` trigger also fires and logs
7. Two audit log entries are created per adjustment (one from function, one from trigger)

---

## 8. page_navigation.puml - Application Page Map

**File:** `docs/plantuml/page_navigation.puml`

A component diagram showing all application pages organized by access level:

- **Public** - /login, /register, /pending
- **All authenticated** - / (dashboard), /inventory, /shipments, /containers, /cargo
- **Admin only** - /warehouses, /carriers, /routes, /locations, /reports, /users, /admin/approvals/users, /admin/approvals/admin-requests
- **Staff only** - /staff/request-admin

---

## 9. setup_sequence.puml - Database Setup Sequence

**File:** `docs/plantuml/setup_sequence.puml`

A sequence diagram showing what happens when a developer runs `npm run db:setup`:

1. Loads environment variables from .env.local
2. Executes SQL files in order (001 through 005)
3. Creates Supabase Auth accounts via direct SQL INSERT into auth.users and auth.identities
4. Uses pgcrypto (extensions.crypt) for bcrypt password hashing
5. Sets all token columns to empty strings (critical for Supabase GoTrue compatibility)

---

## Summary of Changes from Initial Design to Final Implementation

| Aspect               | Initial (Proposal/Prog1/Prog2) | Final Implementation                                                     |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Number of tables     | 12                             | 15 (added audit_logs, admin_access_requests, plus account_status column) |
| Auth approach        | Planned as manual cookies      | Supabase Auth with email/password, session cookies via @supabase/ssr     |
| User status          | Not planned                    | account_status column (pending_registration, active, rejected, disabled) |
| Admin promotion      | Not planned                    | Full workflow with admin_access_requests table and approval UI           |
| Audit logging        | Minimal                        | audit_logs table with trigger + stored function                          |
| Inventory management | Basic CRUD                     | Stored function fn_update_inventory() with negative-quantity guard       |
| Views                | 2 planned                      | 2 implemented (view_shipment_summary, view_warehouse_inventory)          |
| Staff-warehouse link | Through manages only           | Direct warehouse_id FK on warehouse_staff table                          |
| Dashboard            | Static KPIs                    | Personalized, warehouse-scoped KPIs per logged-in user                   |
