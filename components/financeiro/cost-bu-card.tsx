import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import type { BusinessUnit, CostFrequency } from "@/lib/types"
import { ArrowRight } from "lucide-react"

const typeLabels: Record<string, string> = {
  educacao: "Educação",
  servicos: "Serviços",
  saas: "SaaS",
  agencia: "Agência",
}

// Multiplicadores para normalizar qualquer frequência em equivalente mensal
const toMonthly: Record<CostFrequency, number> = {
  diario: 30,
  semanal: 30 / 7,
  quinzenal: 2,
  mensal: 1,
  anual: 1 / 12,
}

type RuleRow = {
  id: string
  frequency: CostFrequency
  last_amount: number | null
}

type Props = {
  bu: BusinessUnit
  rules: RuleRow[]
}

export function CostBuCard({ bu, rules }: Props) {
  const totalMensal = rules.reduce((acc, r) => {
    const amount = Number(r.last_amount ?? 0)
    return acc + amount * toMonthly[r.frequency]
  }, 0)

  const countByFreq = rules.reduce<Record<string, number>>((acc, r) => {
    acc[r.frequency] = (acc[r.frequency] ?? 0) + 1
    return acc
  }, {})

  return (
    <Link href={`/financeiro/central-custo/${bu.id}`} className="group">
      <Card className="overflow-hidden py-0 gap-0 transition-all group-hover:border-primary/40 group-hover:shadow-sm">
        <div className="h-0.5 w-full bg-border group-hover:bg-primary/50 transition-colors" />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{bu.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{typeLabels[bu.type] ?? bu.type}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Mensal estimado
              </p>
              <p className="text-lg font-bold tabular-nums leading-none truncate">
                {formatCurrency(totalMensal)}
              </p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                Anual
              </p>
              <p className="text-sm font-semibold tabular-nums leading-none text-foreground/70 truncate">
                {formatCurrency(totalMensal * 12)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{rules.length}</span>{" "}
              {rules.length === 1 ? "regra" : "regras"}
            </span>
            {Object.entries(countByFreq).map(([freq, count]) => (
              <span key={freq}>
                <span className="font-semibold text-foreground">{count}</span> {freqLabel(freq as CostFrequency)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function freqLabel(freq: CostFrequency) {
  return {
    diario: "diário",
    semanal: "semanal",
    quinzenal: "quinzenal",
    mensal: "mensal",
    anual: "anual",
  }[freq]
}
