export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-neutral-800 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
      <SkeletonBox className="mb-2 h-3 w-16" />
      <SkeletonBox className="h-7 w-12" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-4 border-b border-slate-100 px-2 py-2.5 dark:border-neutral-800">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-3.5 ${i === 0 ? "w-10" : "w-20"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <SkeletonBox className="mb-3 h-3 w-32" />
      <div className="flex gap-4 border-b border-slate-200 px-2 py-2 dark:border-neutral-800">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <SkeletonBox className="h-5 w-48" />
        <SkeletonBox className="mt-2 h-3 w-72" />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonTable rows={5} cols={4} />
        <SkeletonTable rows={5} cols={3} />
      </div>
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-5 w-40" />
        <SkeletonBox className="h-8 w-24 rounded" />
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
