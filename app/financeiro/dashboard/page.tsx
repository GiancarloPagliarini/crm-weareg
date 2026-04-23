import { createClient } from "@/lib/supabase/server"
import { currentMonthRange, formatCurrency, formatPercent } from "@/lib/formatters"
import { TRACKING_START_DATE } from "@/lib/constants"
import type { BankBalance, DashboardKpis, BusinessUnit } from "@/lib/types"
import { KpiCard } from "@/components/financeiro/kpi-card"
import { BankCard } from "@/components/financeiro/bank-card"
import { BuCard } from "@/components/financeiro/bu-card"
import { DashboardFilters } from "@/components/financeiro/dashboard-filters"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  ReceiptText,
} from "lucide-react"

type SearchParams = Promise<{
  from?: string | string[]
  to?: string | string[]
  bu?: string | string[]
}>

function pickString(v: string | string[] | undefined): string | null {
  if (typeof v === "string" && v.trim() !== "") return v
  return null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const customFrom = pickString(sp.from)
  const customTo   = pickString(sp.to)
  const filterBuId = pickString(sp.bu)

  const supabase = await createClient()
  const { start, end } =
    customFrom && customTo
      ? { start: customFrom, end: customTo }
      : currentMonthRange()

  const receivablesQuery = supabase
    .from("receivables")
    .select("amount")
    .eq("status", "pendente")
    .gte("created_at", TRACKING_START_DATE)
  if (filterBuId) receivablesQuery.eq("business_unit_id", filterBuId)

  const [
    { data: kpisRaw },
    { data: bankBalances },
    { data: businessUnits },
    { data: receivablesRaw },
  ] = await Promise.all([
    supabase.rpc("fn_dashboard_kpis", {
      p_start_date: start,
      p_end_date: end,
      p_business_unit_id: filterBuId,
    }),
    supabase.from("v_bank_balances").select("*"),
    supabase.from("business_units").select("id, name, slug, type").eq("is_active", true),
    receivablesQuery,
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

  const bus = (businessUnits as BusinessUnit[] ?? [])
  const selectedBu = filterBuId ? bus.find(b => b.id === filterBuId) ?? null : null

  // KPIs por BU (só quando NÃO há filtro de BU — senão fica redundante)
  const buKpis = filterBuId
    ? []
    : await Promise.all(
        bus.map(async (bu) => {
          const { data } = await supabase.rpc("fn_dashboard_kpis", {
            p_start_date: start,
            p_end_date: end,
            p_business_unit_id: bu.id,
          })
          return { bu, kpis: data as DashboardKpis ?? null }
        })
      )

  const periodLabel = (() => {
    if (customFrom && customTo) {
      const sameDay = customFrom === customTo
      if (sameDay) {
        return new Date(customFrom + "T00:00:00").toLocaleDateString("pt-BR")
      }
      return `${new Date(customFrom + "T00:00:00").toLocaleDateString("pt-BR")} — ${new Date(customTo + "T00:00:00").toLocaleDateString("pt-BR")}`
    }
    return new Date(start + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedBu ? `${selectedBu.name} — ` : "Visão consolidada — "}
          {periodLabel}
        </p>
      </div>

      <DashboardFilters
        businessUnits={bus.map(b => ({ id: b.id, name: b.name }))}
      />

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
          subValue={kpis.margem_bruta}
        />
        <KpiCard
          label="Lucro líquido"
          value={formatCurrency(kpis.lucro_liquido)}
          icon={TrendingUp}
          sub={formatPercent(kpis.margem_liquida)}
          subValue={kpis.margem_liquida}
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

      {/* Contas bancárias — só quando NÃO há filtro de BU (saldos são globais) */}
      {!filterBuId && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Contas bancárias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(bankBalances as BankBalance[] ?? []).map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))}
            {(bankBalances ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">Nenhuma conta cadastrada.</p>
            )}
          </div>
        </div>
      )}

      {/* KPIs por BU — só quando NÃO há filtro de BU */}
      {!filterBuId && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Por unidade de negócio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {buKpis.map(({ bu, kpis: buKpi }) => (
              <BuCard key={bu.id} bu={bu} kpis={buKpi} />
            ))}
            {buKpis.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-4">Nenhuma BU cadastrada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
