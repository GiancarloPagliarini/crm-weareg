import { Skeleton } from "@/components/ui/skeleton"

function KpiSkeleton() {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-28" />
    </div>
  )
}

function BankSkeleton() {
  return (
    <div className="border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <Skeleton className="h-7 w-36" />
      <div className="flex gap-5 pt-3 border-t border-border/60">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

function BuSkeleton() {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="space-y-1">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-24" />
      <div className="flex justify-between pt-3 border-t border-border/60">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-12" />
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>

      {/* Bank accounts */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BankSkeleton />
          <BankSkeleton />
        </div>
      </div>

      {/* BU cards */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <BuSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}
