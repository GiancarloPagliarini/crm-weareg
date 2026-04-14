import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import type { BankBalance } from "@/lib/types"
import { Landmark } from "lucide-react"

type Props = { bank: BankBalance }

export function BankCard({ bank }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          {bank.bank_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{formatCurrency(bank.current_balance)}</p>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="text-emerald-600">
            ↑ {formatCurrency(bank.total_entradas)}
          </span>
          <span className="text-rose-600">
            ↓ {formatCurrency(bank.total_saidas)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
