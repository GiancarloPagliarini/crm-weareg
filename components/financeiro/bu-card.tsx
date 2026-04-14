import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const lucro = kpis?.lucro_liquido ?? 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{bu.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{typeLabels[bu.type] ?? bu.type}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground">Faturamento</p>
          <p className="text-base font-semibold">{formatCurrency(kpis?.faturamento ?? 0)}</p>
        </div>
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Lucro líquido</p>
            <p className={cn(
              "font-medium",
              lucro > 0 && "text-emerald-600",
              lucro < 0 && "text-rose-600"
            )}>
              {formatCurrency(lucro)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Margem</p>
            <p className="font-medium">{formatPercent(kpis?.margem_liquida ?? 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
