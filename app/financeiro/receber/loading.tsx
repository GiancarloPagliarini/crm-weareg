import { Skeleton } from "@/components/ui/skeleton"

export default function ReceberLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Table card */}
      <div className="border rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="bg-muted/30 px-4 py-3 flex gap-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-3.5 border-t border-border/50">
            <Skeleton className="h-3.5 w-28 shrink-0" />
            <Skeleton className="h-3.5 w-40 shrink-0" />
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-20 shrink-0" />
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-24 ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
