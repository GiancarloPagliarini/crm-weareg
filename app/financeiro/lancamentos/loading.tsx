import { Skeleton } from "@/components/ui/skeleton"

export default function LancamentosLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36 shrink-0" />
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/60">
        <Skeleton className="h-9 flex-1 min-w-48" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-44" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-muted/30 px-4 py-2.5 flex gap-4">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-40 flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>

        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-t border-border/50"
          >
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-20 shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-24 shrink-0" />
            <Skeleton className="h-3.5 w-20 shrink-0" />
            <Skeleton className="h-3.5 w-24 ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
