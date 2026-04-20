import { createClient } from "@/lib/supabase/server"
import { currentMonthRange, formatCurrency, formatPercent } from "@/lib/formatters"
import type { DreRow } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export default async function DrePage() {
  const supabase = await createClient()
  const { start, end } = currentMonthRange()

  const { data: rows } = await supabase.rpc("fn_dre", {
    p_start_date: start,
    p_end_date: end,
    p_business_unit_id: null,
  })

  const dre = (rows as DreRow[]) ?? []

  const receitaBruta  = dre.find((r) => r.line_type === "receita")?.amount ?? 0
  const deducoes      = dre.find((r) => r.line_type === "deducao")?.amount ?? 0
  const custosDiretos = dre.find((r) => r.line_type === "custo_direto")?.amount ?? 0
  const despesasOp    = dre.find((r) => r.line_type === "despesa_operacional")?.amount ?? 0

  const receitaLiquida = receitaBruta + deducoes
  const lucroBruto     = receitaLiquida + custosDiretos
  const lucroLiquido   = lucroBruto + despesasOp

  const margemBruta   = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0
  const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0

  const periodo = new Date(start + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">DRE Gerencial</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{periodo}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Receita líquida" value={receitaLiquida} />
        <KpiCard label="Lucro bruto"     value={lucroBruto}     margin={margemBruta} />
        <KpiCard label="Lucro líquido"   value={lucroLiquido}   margin={margemLiquida} highlight />
      </div>

      {/* Demonstrativo */}
      <Card className="overflow-hidden py-0 gap-0">
        <div className="px-5 py-4 border-b border-border/60">
          <p className="text-sm font-semibold">Demonstrativo de Resultado</p>
        </div>

        <div className="px-5 py-4 space-y-1">
          <Line label="Receita bruta"             value={receitaBruta} />
          <Line label="(−) Deduções"              value={deducoes}      indent />

          <div className="pt-1">
            <Line label="Receita líquida"         value={receitaLiquida} subtotal />
          </div>

          <Line label="(−) Custos diretos (CPV)"  value={custosDiretos}  indent />

          <div className="pt-1">
            <Line label="Lucro bruto"             value={lucroBruto}     subtotal margin={margemBruta} />
          </div>

          <Line label="(−) Despesas operacionais" value={despesasOp}     indent />

          <div className="pt-1">
            <Line label="Lucro líquido"           value={lucroLiquido}   total   margin={margemLiquida} />
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ── KPI card ─────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  margin,
  highlight,
}: {
  label: string
  value: number
  margin?: number
  highlight?: boolean
}) {
  const isPos = value > 0
  const isNeg = value < 0
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className={cn(
        "h-0.5 w-full",
        isPos ? "bg-emerald-400" : isNeg ? "bg-rose-400" : "bg-border"
      )} />
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          {label}
        </p>
        <p className={cn(
          "font-bold tabular-nums leading-none",
          highlight ? "text-xl" : "text-lg",
          isPos ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-foreground"
        )}>
          {formatCurrency(value)}
        </p>
        {margin !== undefined && (
          <p className={cn(
            "text-xs font-medium mt-1.5",
            margin >= 30 ? "text-emerald-600" : margin >= 10 ? "text-amber-600" : "text-rose-600"
          )}>
            Margem {formatPercent(margin)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Linha do DRE ─────────────────────────────────────────── */
function Line({
  label,
  value,
  indent,
  subtotal,
  total,
  margin,
}: {
  label: string
  value: number
  indent?: boolean
  subtotal?: boolean
  total?: boolean
  margin?: number
}) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4",
      !subtotal && !total && "py-1.5",
      indent && "pl-4",
      subtotal && "py-2.5 px-3 bg-muted/40 rounded-lg",
      total && "py-3 px-3 rounded-lg",
      total && value > 0 && "bg-emerald-50",
      total && value <= 0 && "bg-rose-50",
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "text-sm",
          indent   && "text-foreground/60",
          subtotal && "font-medium",
          total    && "font-semibold",
        )}>
          {label}
        </span>
        {margin !== undefined && (
          <span className={cn(
            "text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
            margin >= 30 ? "bg-emerald-100 text-emerald-700"
            : margin >= 10 ? "bg-amber-100 text-amber-700"
            : "bg-rose-100 text-rose-700"
          )}>
            {formatPercent(margin)}
          </span>
        )}
      </div>

      <span className={cn(
        "font-mono tabular-nums shrink-0",
        !total && "text-sm",
        indent   && value < 0 && "text-rose-600",
        subtotal && "font-medium text-sm",
        total    && "font-bold text-base",
        total    && value > 0 && "text-emerald-700",
        total    && value <= 0 && "text-rose-700",
      )}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
