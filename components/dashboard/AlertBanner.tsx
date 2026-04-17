import { getPool } from "@/lib/db";
import { AlertTriangle, Clock } from "lucide-react";

type AlertBannerProps = {
  warehouseIds: number[];
  locationIds: number[];
};

type OvercapRow = { warehouse_id: number; name: string; capacity: number; used: string | number };

export async function AlertBanner({ warehouseIds, locationIds }: AlertBannerProps) {
  if (warehouseIds.length === 0) return null;

  const pool = getPool();
  const whParams = warehouseIds.map((_, i) => `$${i + 1}`).join(",");

  // Warehouses above 90% capacity
  const overcapRes = await pool.query(
    `SELECT w.warehouse_id, w.name, w.capacity, COALESCE(v.total_weight, 0) AS used
     FROM warehouses w
     LEFT JOIN view_warehouse_inventory v ON v.warehouse_id = w.warehouse_id
     WHERE w.warehouse_id IN (${whParams})
       AND COALESCE(v.total_weight, 0) > w.capacity * 0.9`,
    warehouseIds
  );
  const overcapWarehouses = overcapRes.rows as OvercapRow[];

  // Overdue pending shipments (> 7 days old)
  let overdueCount = 0;
  if (locationIds.length > 0) {
    const locParams = locationIds.map((_, i) => `$${i + 1}`).join(",");
    const overdueRes = await pool.query(
      `SELECT COUNT(*) AS c FROM shipments
       WHERE status = 'PENDING'
         AND shipment_date < CURRENT_DATE - INTERVAL '7 days'
         AND (origin_loc_id IN (${locParams}) OR destination_loc_id IN (${locParams}))`,
      locationIds
    );
    overdueCount = Number(overdueRes.rows[0].c);
  }

  if (overcapWarehouses.length === 0 && overdueCount === 0) return null;

  return (
    <div className="space-y-2">
      {overcapWarehouses.map((w) => {
        const pct = w.capacity > 0 ? Math.round((Number(w.used) / w.capacity) * 100) : 0;
        return (
          <div
            key={w.warehouse_id}
            className="flex items-center gap-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              <span className="font-semibold">{w.name}</span> is at {pct}% capacity
              ({Number(w.used).toLocaleString()} / {w.capacity.toLocaleString()} kg)
            </span>
          </div>
        );
      })}

      {overdueCount > 0 && (
        <div className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            <span className="font-semibold">{overdueCount}</span> shipment{overdueCount !== 1 ? "s" : ""} pending for more than 7 days
          </span>
        </div>
      )}
    </div>
  );
}
