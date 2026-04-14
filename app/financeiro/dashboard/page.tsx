import { createClient } from "@/lib/supabase/server"
import { currentMonthRange, formatCurrency, formatPercent } from "@/lib/formatters"
import type { BankBalance, DashboardKpis, BusinessUnit } from "@/lib/types"
import { KpiCard } from "@/components/financeiro/kpi-card"
import { BankCard } from "@/components/financeiro/bank-card"
import { BuCard } from "@/components/financeiro/bu-card"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  ReceiptText,
  Percent,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { start, end } = currentMonthRange()

  const [
    { data: kpisRaw },
    { data: bankBalances },
    { data: businessUnits },
    { data: receivablesRaw },
  ] = await Promise.all([
    supabase.rpc("fn_dashboard_kpis", {
      p_start_date: start,
      p_end_date: end,
      p_business_unit_id: null,
    }),
    supabase.from("v_bank_balances").select("*"),
    supabase.from("business_units").select("id, name, slug, type").eq("is_active", true),
    supabase
      .from("receivables")
      .select("amount")
      .eq("status", "pendente"),
  ])

  const kpis: DashboardKpis = kpisRaw ?? {
    faturamento: 0, despesas_totais: 0, receita_liquida: 0,
    lucro_bruto: 0, lucro_liquido: 0, margem_bruta: 0, margem_liquida: 0,
  }

  const totalSaldo = (bankBalances as BankBalance[] ?? []).reduce(
    (acc, b) => acc + b.current_balance, 0
  )

  const totalRecebiveis = (receivablesRaw ?? []).reduce(
    (acc: number, r: { amount: number }) => acc + r.amount, 0
  )

  // KPIs por BU
  const buKpis = await Promise.all(
    (businessUnits as BusinessUnit[] ?? []).map(async (bu) => {
      const { data } = await supabase.rpc("fn_dashboard_kpis", {
        p_start_date: start,
        p_end_date: end,
        p_business_unit_id: bu.id,
      })
      return { bu, kpis: data as DashboardKpis ?? null }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão consolidada — {new Date(start + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Saldo total"
          value={formatCurrency(totalSaldo)}
          icon={Landmark}
        />
        <KpiCard
          label="Faturamento"
          value={formatCurrency(kpis.faturamento)}
          icon={DollarSign}
        />
        <KpiCard
          label="Lucro bruto"
          value={formatCurrency(kpis.lucro_bruto)}
          icon={TrendingUp}
          sub={formatPercent(kpis.margem_bruta)}
        />
        <KpiCard
          label="Lucro líquido"
          value={formatCurrency(kpis.lucro_liquido)}
          icon={TrendingUp}
          sub={formatPercent(kpis.margem_liquida)}
          highlight={kpis.lucro_liquido > 0 ? "positive" : kpis.lucro_liquido < 0 ? "negative" : undefined}
        />
        <KpiCard
          label="Despesas totais"
          value={formatCurrency(kpis.despesas_totais)}
          icon={TrendingDown}
          highlight="negative"
        />
        <KpiCard
          label="A receber"
          value={formatCurrency(totalRecebiveis)}
          icon={ReceiptText}
        />
      </div>

      {/* Contas bancárias */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Contas bancárias</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(bankBalances as BankBalance[] ?? []).map((bank) => (
            <BankCard key={bank.id} bank={bank} />
          ))}
          {(bankBalances ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">Nenhuma conta cadastrada.</p>
          )}
        </div>
      </div>

      {/* KPIs por BU */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Por unidade de negócio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {buKpis.map(({ bu, kpis: buKpi }) => (
            <BuCard key={bu.id} bu={bu} kpis={buKpi} />
          ))}
          {buKpis.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-4">Nenhuma BU cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  )
}
