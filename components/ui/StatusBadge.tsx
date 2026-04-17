const statusStyles: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  IN_TRANSIT: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? statusStyles.CANCELLED;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export function statusColor(status: string): string {
  if (status === "DELIVERED") return "#10b981";
  if (status === "IN_TRANSIT") return "#0ea5e9";
  if (status === "PENDING") return "#f59e0b";
  return "#ef4444";
}
