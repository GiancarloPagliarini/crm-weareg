import { Skeleton } from "@/components/ui/skeleton"

export default function ImportarLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Upload area */}
      <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <Skeleton className="h-9 w-36 mt-2" />
      </div>

      {/* Global selects row */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Table preview */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-muted/30 px-4 py-2.5 flex gap-4">
          <Skeleton className="h-3 w-4 shrink-0" />
          <Skeleton className="h-3 w-20 shrink-0" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-32 shrink-0" />
          <Skeleton className="h-3 w-32 shrink-0" />
          <Skeleton className="h-3 w-24 shrink-0 ml-auto" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-border/50">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <Skeleton className="h-3.5 w-20 shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-8 w-32 shrink-0" />
            <Skeleton className="h-8 w-32 shrink-0" />
            <Skeleton className="h-3.5 w-24 ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
