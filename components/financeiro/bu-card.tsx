import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import type { BusinessUnit, DashboardKpis } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  bu: BusinessUnit
  kpis: DashboardKpis | null
}

const typeLabels: Record<string, string> = {
  educacao: "Educação",
  servicos: "Serviços",
  saas: "SaaS",
  agencia: "Agência",
}

export function BuCard({ bu, kpis }: Props) {
  const lucro   = kpis?.lucro_liquido ?? 0
  const margem  = kpis?.margem_liquida ?? 0
  const isPos   = lucro > 0
  const isNeg   = lucro < 0

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className={cn(
        "h-0.5 w-full",
        isPos ? "bg-emerald-400" : isNeg ? "bg-rose-400" : "bg-border"
      )} />
      <CardContent className="p-4">
        <div className="mb-4">
          <p className="font-semibold text-sm leading-snug">{bu.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{typeLabels[bu.type] ?? bu.type}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Faturamento
          </p>
          <p className="text-lg font-bold tabular-nums leading-none">
            {formatCurrency(kpis?.faturamento ?? 0)}
          </p>
        </div>

        <div className="flex justify-between items-end mt-3 pt-3 border-t border-border/60">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              Lucro líquido
            </p>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              isPos ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-foreground"
            )}>
              {formatCurrency(lucro)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              Margem
            </p>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              margem >= 20 ? "text-emerald-600"
              : margem >= 5  ? "text-amber-600"
              : "text-rose-600"
            )}>
              {formatPercent(margem)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
