import { Skeleton } from "@/components/ui/skeleton"

export default function CentralCustoBuLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Skeleton className="h-0.5 w-full" />
        <div className="p-5 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 flex gap-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24 ml-auto" />
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-3.5 border-t border-border/50">
            <Skeleton className="h-3.5 w-28 shrink-0" />
            <Skeleton className="h-3.5 w-32 shrink-0" />
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-20 ml-auto shrink-0" />
            <Skeleton className="h-3.5 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
