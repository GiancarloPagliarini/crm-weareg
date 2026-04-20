import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import type { BankBalance } from "@/lib/types"
import { Landmark } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = { bank: BankBalance }

export function BankCard({ bank }: Props) {
  const isPos = bank.current_balance >= 0

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className={cn("h-0.5 w-full", isPos ? "bg-emerald-400" : "bg-rose-400")} />
      <CardContent className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">{bank.bank_name}</p>
        </div>

        <p className={cn(
          "text-2xl font-bold tabular-nums leading-none",
          !isPos && "text-rose-600"
        )}>
          {formatCurrency(bank.current_balance)}
        </p>

        <div className="flex gap-5 mt-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-500">↑</span>
            <span className="text-muted-foreground">Entradas</span>
            <span className="font-semibold text-emerald-600 tabular-nums">
              {formatCurrency(bank.total_entradas)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-rose-500">↓</span>
            <span className="text-muted-foreground">Saídas</span>
            <span className="font-semibold text-rose-600 tabular-nums">
              {formatCurrency(bank.total_saidas)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
