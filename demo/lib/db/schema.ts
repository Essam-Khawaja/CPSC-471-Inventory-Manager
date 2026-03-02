import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
  date,
  pgEnum,
  unique,
  check,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum         = pgEnum("role",            ["admin", "warehouse_staff"]);
export const shiftEnum        = pgEnum("shift",           ["morning", "afternoon", "night"]);
export const shipmentStatus   = pgEnum("shipment_status", ["pending", "in_transit", "delivered"]);
export const carrierTypeEnum  = pgEnum("carrier_type",    ["sea", "air", "road", "rail"]);

// ─── Location ─────────────────────────────────────────────────────────────────
export const location = pgTable("location", {
  locationId:   uuid("location_id").primaryKey().defaultRandom(),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  locationType: varchar("location_type", { length: 100 }).notNull(),
});

// ─── Route ────────────────────────────────────────────────────────────────────
export const route = pgTable("route", {
  routeId:       uuid("route_id").primaryKey().defaultRandom(),
  estimatedTime: integer("estimated_time").notNull(), // hours
});

// ─── Carrier ──────────────────────────────────────────────────────────────────
export const carrier = pgTable("carrier", {
  carrierId:   uuid("carrier_id").primaryKey().defaultRandom(),
  name:        varchar("name",         { length: 255 }).notNull(),
  carrierType: carrierTypeEnum("carrier_type").notNull(),
});

// ─── User (base) ──────────────────────────────────────────────────────────────
export const user = pgTable("user", {
  userId:   uuid("user_id").primaryKey().defaultRandom(),
  name:     varchar("name",     { length: 255 }).notNull(),
  email:    varchar("email",    { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId:   roleEnum("role_id").notNull(),
});

// ─── Admin (ISA specialisation) ───────────────────────────────────────────────
export const admin = pgTable("admin", {
  userId:     uuid("user_id").primaryKey().references(() => user.userId, { onDelete: "cascade" }),
  adminLevel: integer("admin_level").notNull().default(1),
});

// ─── WarehouseStaff (ISA specialisation) ──────────────────────────────────────
export const warehouseStaff = pgTable("warehouse_staff", {
  userId:   uuid("user_id").primaryKey().references(() => user.userId, { onDelete: "cascade" }),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  shift:    shiftEnum("shift").notNull(),
});

// ─── Warehouse ────────────────────────────────────────────────────────────────
export const warehouse = pgTable("warehouse", {
  warehouseId: uuid("warehouse_id").primaryKey().defaultRandom(),
  name:        varchar("name",    { length: 255 }).notNull(),
  address:     varchar("address", { length: 500 }).notNull(),
  capacity:    integer("capacity").notNull(),
  locationId:  uuid("location_id").notNull().references(() => location.locationId),
});

// ─── Manages (Admin ↔ Warehouse) ──────────────────────────────────────────────
export const manages = pgTable("manages", {
  adminUserId: uuid("admin_user_id").notNull().references(() => admin.userId,     { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouse.warehouseId, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.adminUserId, t.warehouseId] })]);

// ─── CargoItem ────────────────────────────────────────────────────────────────
export const cargoItem = pgTable("cargo_item", {
  cargoId:   uuid("cargo_id").primaryKey().defaultRandom(),
  cargoType: varchar("cargo_type", { length: 100 }).notNull(),
  weight:    numeric("weight", { precision: 10, scale: 2 }).notNull(), // kg
});

// ─── InventoryRecord (weak entity — composite PK) ─────────────────────────────
export const inventoryRecord = pgTable("inventory_record", {
  cargoId:        uuid("cargo_id").notNull().references(() => cargoItem.cargoId,     { onDelete: "cascade" }),
  warehouseId:    uuid("warehouse_id").notNull().references(() => warehouse.warehouseId, { onDelete: "cascade" }),
  quantityStored: integer("quantity_stored").notNull().default(0),
  lastUpdated:    timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.cargoId, t.warehouseId] })]);

// ─── Shipment ─────────────────────────────────────────────────────────────────
export const shipment = pgTable("shipment", {
  shipmentId:       uuid("shipment_id").primaryKey().defaultRandom(),
  shipmentDate:     date("shipment_date").notNull(),
  status:           shipmentStatus("status").notNull().default("pending"),
  carrierId:        uuid("carrier_id").notNull().references(() => carrier.carrierId),
  routeId:          uuid("route_id").notNull().references(() => route.routeId),
  originLocId:      uuid("origin_loc_id").notNull().references(() => location.locationId),
  destinationLocId: uuid("destination_loc_id").notNull().references(() => location.locationId),
});

// ─── Container ────────────────────────────────────────────────────────────────
export const container = pgTable("container", {
  containerId:   uuid("container_id").primaryKey().defaultRandom(),
  containerType: varchar("container_type", { length: 100 }).notNull(),
  maxCapacity:   numeric("max_capacity", { precision: 10, scale: 2 }).notNull(), // m³
  shipmentId:    uuid("shipment_id").references(() => shipment.shipmentId, { onDelete: "set null" }),
});

// ─── ContainerCargo (many-to-many CargoItem ↔ Container) ──────────────────────
// Unique index on cargo_id alone enforces Assumption 16:
// a CargoItem can only be in one Container at a time
export const containerCargo = pgTable("container_cargo", {
  cargoId:     uuid("cargo_id").notNull().references(() => cargoItem.cargoId,   { onDelete: "cascade" }),
  containerId: uuid("container_id").notNull().references(() => container.containerId, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.cargoId, t.containerId] }),
  unique("uq_cargo_single_container").on(t.cargoId), // Assumption 16
]);

// ─── Type exports (handy for your app) ───────────────────────────────────────
export type Location        = typeof location.        $inferSelect;
export type Route           = typeof route.           $inferSelect;
export type Carrier         = typeof carrier.         $inferSelect;
export type User            = typeof user.            $inferSelect;
export type Admin           = typeof admin.           $inferSelect;
export type WarehouseStaff  = typeof warehouseStaff.  $inferSelect;
export type Warehouse       = typeof warehouse.       $inferSelect;
export type Manages         = typeof manages.         $inferSelect;
export type CargoItem       = typeof cargoItem.       $inferSelect;
export type InventoryRecord = typeof inventoryRecord. $inferSelect;
export type Shipment        = typeof shipment.        $inferSelect;
export type Container       = typeof container.       $inferSelect;
export type ContainerCargo  = typeof containerCargo.  $inferSelect;

export type NewLocation        = typeof location.        $inferInsert;
export type NewCarrier         = typeof carrier.         $inferInsert;
export type NewWarehouse       = typeof warehouse.       $inferInsert;
export type NewShipment        = typeof shipment.        $inferInsert;
export type NewContainer       = typeof container.       $inferInsert;
export type NewCargoItem       = typeof cargoItem.       $inferInsert;
export type NewInventoryRecord = typeof inventoryRecord. $inferInsert;