import { Skeleton } from "@/components/ui/skeleton"

export default function CentralCustoLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden">
            <Skeleton className="h-0.5 w-full" />
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="pt-3 border-t border-border/60 flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
