import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string
  icon: LucideIcon
  sub?: string
  subValue?: number
  highlight?: "positive" | "negative"
}

export function KpiCard({ label, value, icon: Icon, sub, subValue, highlight }: Props) {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      {highlight && (
        <div className={cn(
          "h-0.5 w-full",
          highlight === "positive" ? "bg-emerald-400" : "bg-rose-400"
        )} />
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
              {label}
            </p>
            <p className={cn(
              "text-xl font-bold mt-2 leading-none tabular-nums",
              highlight === "positive" && "text-emerald-600",
              highlight === "negative" && "text-rose-600"
            )}>
              {value}
            </p>
            {sub && (
              <p className={cn(
                "text-xs font-semibold mt-1.5",
                subValue !== undefined
                  ? subValue >= 30 ? "text-emerald-600"
                    : subValue >= 10 ? "text-amber-600"
                    : "text-rose-600"
                  : "text-muted-foreground"
              )}>
                {sub}
              </p>
            )}
          </div>
          <div className={cn(
            "shrink-0 rounded-lg p-2",
            highlight === "positive" ? "bg-emerald-100"
            : highlight === "negative" ? "bg-rose-100"
            : "bg-muted"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              highlight === "positive" ? "text-emerald-600"
              : highlight === "negative" ? "text-rose-600"
              : "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
