import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  in_transit: {
    label: "In Transit",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-success/15 text-success border-success/30",
  },
  stored: {
    label: "Stored",
    className: "bg-muted text-muted-foreground border-border",
  },
  available: {
    label: "Available",
    className: "bg-success/15 text-success border-success/30",
  },
  loaded: {
    label: "Loaded",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  active: {
    label: "Active",
    className: "bg-success/15 text-success border-success/30",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
  },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
