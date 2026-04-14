import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string
  icon: LucideIcon
  sub?: string
  highlight?: "positive" | "negative"
}

export function KpiCard({ label, value, icon: Icon, sub, highlight }: Props) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p
              className={cn(
                "text-lg font-semibold mt-1 leading-none",
                highlight === "positive" && "text-emerald-600",
                highlight === "negative" && "text-rose-600"
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
          <div className="shrink-0 rounded-md bg-muted p-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
