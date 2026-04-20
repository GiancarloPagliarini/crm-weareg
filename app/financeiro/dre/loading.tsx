import { Skeleton } from "@/components/ui/skeleton"

export default function DreLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden">
            <div className="h-0.5 w-full bg-muted" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Demonstrativo card */}
      <div className="border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="px-5 py-4 space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className={`h-3.5 ${i === 3 || i === 6 ? "w-36" : "w-48"}`} />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
