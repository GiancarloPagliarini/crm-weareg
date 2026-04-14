import { createClient } from "@/lib/supabase/server"
import { currentMonthRange, formatCurrency, formatPercent } from "@/lib/formatters"
import type { DreRow } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default async function DrePage() {
  const supabase = await createClient()
  const { start, end } = currentMonthRange()

  const { data: rows } = await supabase.rpc("fn_dre", {
    p_start_date: start,
    p_end_date: end,
    p_business_unit_id: null,
  })

  const dre = (rows as DreRow[] ?? [])

  const receitaBruta = dre.find((r) => r.line_type === "receita")?.amount ?? 0
  const deducoes = dre.find((r) => r.line_type === "deducao")?.amount ?? 0
  const custosDiretos = dre.find((r) => r.line_type === "custo_direto")?.amount ?? 0
  const despesasOp = dre.find((r) => r.line_type === "despesa_operacional")?.amount ?? 0

  const receitaLiquida = receitaBruta + deducoes
  const lucrosBruto = receitaLiquida + custosDiretos
  const lucroLiquido = lucrosBruto + despesasOp

  const margemBruta = receitaLiquida > 0 ? (lucrosBruto / receitaLiquida) * 100 : 0
  const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0

  const periodo = new Date(start + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">DRE Gerencial</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{periodo}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demonstrativo de Resultado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <DreRow label="Receita bruta" value={receitaBruta} />
          <DreRow label="(−) Deduções" value={deducoes} indent />
          <Separator className="my-2" />
          <DreRow label="Receita líquida" value={receitaLiquida} subtotal />
          <DreRow label="(−) Custos diretos (CPV)" value={custosDiretos} indent />
          <Separator className="my-2" />
          <DreRow label="Lucro bruto" value={lucrosBruto} subtotal>
            <span className="text-xs text-muted-foreground ml-2">
              Margem {formatPercent(margemBruta)}
            </span>
          </DreRow>
          <DreRow label="(−) Despesas operacionais" value={despesasOp} indent />
          <Separator className="my-2" />
          <DreRow label="Lucro líquido" value={lucroLiquido} total>
            <span className="text-xs text-muted-foreground ml-2">
              Margem {formatPercent(margemLiquida)}
            </span>
          </DreRow>
        </CardContent>
      </Card>
    </div>
  )
}

function DreRow({
  label,
  value,
  indent,
  subtotal,
  total,
  children,
}: {
  label: string
  value: number
  indent?: boolean
  subtotal?: boolean
  total?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={cn(
      "flex items-center justify-between py-1.5",
      indent && "pl-4",
      subtotal && "font-medium",
      total && "font-semibold text-base"
    )}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {children}
      </div>
      <span className={cn(
        "font-mono",
        value < 0 && "text-rose-600",
        total && value > 0 && "text-emerald-600",
        total && value < 0 && "text-rose-600"
      )}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
