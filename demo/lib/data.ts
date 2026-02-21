export type UserRole = "admin" | "warehouse_staff"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: "active" | "inactive"
}

export interface Cargo {
  id: string
  name: string
  type: string
  quantity: number
  warehouse: string
  status: "stored" | "in_transit" | "delivered"
}

export interface Shipment {
  id: string
  origin: string
  destination: string
  carrier: string
  status: "pending" | "in_transit" | "delivered"
  departureDate: string
  arrivalDate: string | null
}

export interface Container {
  id: string
  capacity: string
  currentLocation: string
  assignedShipment: string | null
  status: "available" | "loaded" | "in_transit"
}

export interface Warehouse {
  id: string
  name: string
  location: string
  totalCargo: number
}

export const currentUser: User = {
  id: "USR-001",
  name: "Alex Morgan",
  email: "alex.morgan@freight.co",
  role: "admin",
  status: "active",
}

export const warehouses: Warehouse[] = [
  { id: "WH-001", name: "East Coast Hub", location: "Newark, NJ", totalCargo: 342 },
  { id: "WH-002", name: "West Coast Terminal", location: "Long Beach, CA", totalCargo: 518 },
  { id: "WH-003", name: "Gulf Distribution Center", location: "Houston, TX", totalCargo: 215 },
  { id: "WH-004", name: "Midwest Logistics Park", location: "Chicago, IL", totalCargo: 189 },
  { id: "WH-005", name: "Southeast Depot", location: "Atlanta, GA", totalCargo: 276 },
]

export const carriers = [
  "Maersk Line",
  "MSC Shipping",
  "CMA CGM",
  "Evergreen Marine",
  "Hapag-Lloyd",
]

export const cargoTypes = [
  "Electronics",
  "Machinery",
  "Textiles",
  "Food & Beverage",
  "Chemicals",
  "Automotive Parts",
  "Raw Materials",
]

export const shipments: Shipment[] = [
  { id: "SHP-2401", origin: "East Coast Hub", destination: "West Coast Terminal", carrier: "Maersk Line", status: "in_transit", departureDate: "2026-02-10", arrivalDate: null },
  { id: "SHP-2402", origin: "Gulf Distribution Center", destination: "East Coast Hub", carrier: "MSC Shipping", status: "pending", departureDate: "2026-02-18", arrivalDate: null },
  { id: "SHP-2403", origin: "West Coast Terminal", destination: "Midwest Logistics Park", carrier: "CMA CGM", status: "delivered", departureDate: "2026-02-01", arrivalDate: "2026-02-08" },
  { id: "SHP-2404", origin: "Midwest Logistics Park", destination: "Southeast Depot", carrier: "Evergreen Marine", status: "in_transit", departureDate: "2026-02-12", arrivalDate: null },
  { id: "SHP-2405", origin: "Southeast Depot", destination: "Gulf Distribution Center", carrier: "Hapag-Lloyd", status: "pending", departureDate: "2026-02-20", arrivalDate: null },
  { id: "SHP-2406", origin: "East Coast Hub", destination: "Southeast Depot", carrier: "Maersk Line", status: "delivered", departureDate: "2026-01-28", arrivalDate: "2026-02-04" },
  { id: "SHP-2407", origin: "West Coast Terminal", destination: "Gulf Distribution Center", carrier: "MSC Shipping", status: "in_transit", departureDate: "2026-02-14", arrivalDate: null },
]

export const cargoItems: Cargo[] = [
  { id: "CRG-0101", name: "Server Racks", type: "Electronics", quantity: 48, warehouse: "East Coast Hub", status: "stored" },
  { id: "CRG-0102", name: "Industrial Pumps", type: "Machinery", quantity: 120, warehouse: "West Coast Terminal", status: "stored" },
  { id: "CRG-0103", name: "Cotton Bales", type: "Textiles", quantity: 500, warehouse: "Gulf Distribution Center", status: "in_transit" },
  { id: "CRG-0104", name: "Frozen Seafood", type: "Food & Beverage", quantity: 300, warehouse: "Midwest Logistics Park", status: "stored" },
  { id: "CRG-0105", name: "Lithium Batteries", type: "Chemicals", quantity: 1500, warehouse: "East Coast Hub", status: "in_transit" },
  { id: "CRG-0106", name: "Engine Blocks", type: "Automotive Parts", quantity: 75, warehouse: "Southeast Depot", status: "stored" },
  { id: "CRG-0107", name: "Steel Coils", type: "Raw Materials", quantity: 200, warehouse: "West Coast Terminal", status: "delivered" },
  { id: "CRG-0108", name: "LED Panels", type: "Electronics", quantity: 800, warehouse: "Gulf Distribution Center", status: "stored" },
  { id: "CRG-0109", name: "Polyester Fabric", type: "Textiles", quantity: 350, warehouse: "Midwest Logistics Park", status: "in_transit" },
  { id: "CRG-0110", name: "Brake Discs", type: "Automotive Parts", quantity: 420, warehouse: "Southeast Depot", status: "stored" },
]

export const containers: Container[] = [
  { id: "CNT-3001", capacity: "20ft Standard", currentLocation: "East Coast Hub", assignedShipment: "SHP-2401", status: "in_transit" },
  { id: "CNT-3002", capacity: "40ft High Cube", currentLocation: "West Coast Terminal", assignedShipment: null, status: "available" },
  { id: "CNT-3003", capacity: "20ft Standard", currentLocation: "Gulf Distribution Center", assignedShipment: "SHP-2402", status: "loaded" },
  { id: "CNT-3004", capacity: "40ft Standard", currentLocation: "Midwest Logistics Park", assignedShipment: "SHP-2404", status: "in_transit" },
  { id: "CNT-3005", capacity: "20ft Reefer", currentLocation: "Southeast Depot", assignedShipment: null, status: "available" },
  { id: "CNT-3006", capacity: "40ft High Cube", currentLocation: "East Coast Hub", assignedShipment: null, status: "available" },
  { id: "CNT-3007", capacity: "20ft Standard", currentLocation: "West Coast Terminal", assignedShipment: "SHP-2407", status: "in_transit" },
  { id: "CNT-3008", capacity: "40ft Reefer", currentLocation: "Gulf Distribution Center", assignedShipment: null, status: "available" },
]

export const users: User[] = [
  { id: "USR-001", name: "Alex Morgan", email: "alex.morgan@freight.co", role: "admin", status: "active" },
  { id: "USR-002", name: "Jordan Lee", email: "jordan.lee@freight.co", role: "warehouse_staff", status: "active" },
  { id: "USR-003", name: "Sam Rivera", email: "sam.rivera@freight.co", role: "warehouse_staff", status: "active" },
  { id: "USR-004", name: "Taylor Kim", email: "taylor.kim@freight.co", role: "admin", status: "active" },
  { id: "USR-005", name: "Casey Patel", email: "casey.patel@freight.co", role: "warehouse_staff", status: "inactive" },
  { id: "USR-006", name: "Morgan Chen", email: "morgan.chen@freight.co", role: "warehouse_staff", status: "active" },
]
