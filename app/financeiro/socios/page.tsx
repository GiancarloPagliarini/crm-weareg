import { createClient } from "@/lib/supabase/server"
import { currentMonthRange, formatCurrency, formatPercent } from "@/lib/formatters"
import type { ProfitDistributionRow } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

const PALETTE = [
  { avatar: "bg-blue-100 text-blue-700" },
  { avatar: "bg-violet-100 text-violet-700" },
  { avatar: "bg-amber-100 text-amber-700" },
  { avatar: "bg-teal-100 text-teal-700" },
  { avatar: "bg-rose-100 text-rose-700" },
]

export default async function SociosPage() {
  const supabase = await createClient()
  const { start, end } = currentMonthRange()

  const { data: rows } = await supabase.rpc("fn_profit_distribution", {
    p_start_date: start,
    p_end_date: end,
  })

  const distribution = (rows as ProfitDistributionRow[]) ?? []

  const byPartner = distribution.reduce<
    Record<string, { total: number; rows: ProfitDistributionRow[] }>
  >((acc, row) => {
    if (!acc[row.partner_name]) acc[row.partner_name] = { total: 0, rows: [] }
    acc[row.partner_name].total += row.partner_profit
    acc[row.partner_name].rows.push(row)
    return acc
  }, {})

  const partnerEntries = Object.entries(byPartner)
  const totalDistribuido = distribution.reduce((sum, r) => sum + r.partner_profit, 0)

  const periodo = new Date(start + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Distribuição de Lucro</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{periodo}</p>
        </div>

        {distribution.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              Total distribuído
            </p>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              totalDistribuido > 0 ? "text-emerald-600"
              : totalDistribuido < 0 ? "text-rose-600"
              : "text-foreground"
            )}>
              {formatCurrency(totalDistribuido)}
            </p>
          </div>
        )}
      </div>

      {/* Cards por sócio */}
      {partnerEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnerEntries.map(([partner, data], idx) => {
            const palette = PALETTE[idx % PALETTE.length]
            const isPos = data.total > 0
            const isNeg = data.total < 0
            return (
              <Card key={partner} className="overflow-hidden py-0 gap-0">
                <div className={cn(
                  "h-0.5 w-full",
                  isPos ? "bg-emerald-400" : isNeg ? "bg-rose-400" : "bg-border"
                )} />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      palette.avatar
                    )}>
                      {initials(partner)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">{partner}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.rows.length} {data.rows.length === 1 ? "unidade" : "unidades"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/60">
                    <p className={cn(
                      "text-2xl font-bold tabular-nums leading-none",
                      isPos ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-foreground"
                    )}>
                      {formatCurrency(data.total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">lucro do período</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detalhamento por BU — um card por sócio, lado a lado */}
      {distribution.length === 0 && (
        <Card className="py-0 gap-0">
          <div className="text-center text-muted-foreground py-16 text-sm">
            Sem dados para o período. Cadastre lançamentos e participações societárias.
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {partnerEntries.map(([partner, data], partnerIdx) => {
          const palette = PALETTE[partnerIdx % PALETTE.length]
          const isPos = data.total > 0
          const isNeg = data.total < 0

          return (
            <Card key={partner} className="overflow-hidden py-0 gap-0">
              {/* Cabeçalho do card */}
              <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  palette.avatar
                )}>
                  {initials(partner)}
                </div>
                <span className="font-semibold text-sm flex-1 truncate">{partner}</span>
                <span className={cn(
                  "font-bold text-sm tabular-nums shrink-0",
                  isPos ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-foreground"
                )}>
                  {formatCurrency(data.total)}
                </span>
              </div>

              {/* Tabela de BUs */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Unidade de negócio</TableHead>
                    <TableHead className="text-right">Part.</TableHead>
                    <TableHead className="text-right">Lucro BU</TableHead>
                    <TableHead className="text-right pr-5">Seu lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      <TableCell className="pl-5 text-sm py-3">{row.business_unit_name}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums py-3">
                        {formatPercent(row.share_percentage)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono text-sm tabular-nums py-3",
                        row.bu_net_profit < 0 ? "text-rose-600" : "text-foreground/80"
                      )}>
                        {formatCurrency(row.bu_net_profit)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right pr-5 font-mono font-semibold text-sm tabular-nums py-3",
                        row.partner_profit > 0 ? "text-emerald-600"
                        : row.partner_profit < 0 ? "text-rose-600"
                        : "text-foreground"
                      )}>
                        {formatCurrency(row.partner_profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
