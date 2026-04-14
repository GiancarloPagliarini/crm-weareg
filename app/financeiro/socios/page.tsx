import { createClient } from "@/lib/supabase/server"
import { currentMonthRange, formatCurrency, formatPercent } from "@/lib/formatters"
import type { ProfitDistributionRow } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default async function SociosPage() {
  const supabase = await createClient()
  const { start, end } = currentMonthRange()

  const { data: rows } = await supabase.rpc("fn_profit_distribution", {
    p_start_date: start,
    p_end_date: end,
  })

  const distribution = (rows as ProfitDistributionRow[] ?? [])

  // Agrupar por sócio para calcular total por sócio
  const byPartner = distribution.reduce<Record<string, { total: number; rows: ProfitDistributionRow[] }>>(
    (acc, row) => {
      if (!acc[row.partner_name]) acc[row.partner_name] = { total: 0, rows: [] }
      acc[row.partner_name].total += row.partner_profit
      acc[row.partner_name].rows.push(row)
      return acc
    },
    {}
  )

  const periodo = new Date(start + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Distribuição de Lucro</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{periodo}</p>
      </div>

      {/* Cards por sócio */}
      {Object.keys(byPartner).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(byPartner).map(([partner, data]) => (
            <Card key={partner}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{partner}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-semibold",
                  data.total > 0 && "text-emerald-600",
                  data.total < 0 && "text-rose-600"
                )}>
                  {formatCurrency(data.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">lucro total do período</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por BU</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sócio</TableHead>
                <TableHead>Unidade de negócio</TableHead>
                <TableHead className="text-right">Participação</TableHead>
                <TableHead className="text-right">Lucro da BU</TableHead>
                <TableHead className="text-right">Lucro do sócio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribution.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    Sem dados para o período. Cadastre lançamentos e participações societárias.
                  </TableCell>
                </TableRow>
              )}
              {distribution.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.partner_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.business_unit_name}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatPercent(row.share_percentage)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono",
                    row.bu_net_profit < 0 && "text-rose-600"
                  )}>
                    {formatCurrency(row.bu_net_profit)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono font-medium",
                    row.partner_profit > 0 && "text-emerald-600",
                    row.partner_profit < 0 && "text-rose-600"
                  )}>
                    {formatCurrency(row.partner_profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
