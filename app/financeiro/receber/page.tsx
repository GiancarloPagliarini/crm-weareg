import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/formatters"
import { TRACKING_START_DATE } from "@/lib/constants"
import type { Receivable } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
}

const statusColors: Record<string, string> = {
  pendente: "text-amber-600 border-amber-300 bg-amber-50",
  pago: "text-emerald-600 border-emerald-300 bg-emerald-50",
  atrasado: "text-rose-600 border-rose-300 bg-rose-50",
  cancelado: "text-muted-foreground",
}

export default async function ReceberPage() {
  const supabase = await createClient()

  const { data: receivables } = await supabase
    .from("receivables")
    .select("*, business_units(name)")
    .gte("created_at", TRACKING_START_DATE)
    .order("due_date", { ascending: true })

  const items = (receivables ?? []) as (Receivable & { business_units: { name: string } | null })[]

  const totalPendente = items
    .filter((r) => r.status === "pendente" || r.status === "atrasado")
    .reduce((acc, r) => acc + r.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">A Receber</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total pendente:{" "}
            <span className="font-medium text-foreground">{formatCurrency(totalPendente)}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Nenhuma conta a receber cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.counterpart_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {r.business_units?.name ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(r.due_date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusColors[r.status])}
                    >
                      {statusLabels[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(r.amount)}
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
