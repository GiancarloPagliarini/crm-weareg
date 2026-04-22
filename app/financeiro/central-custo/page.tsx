import { createClient } from "@/lib/supabase/server"
import type { BusinessUnit, CostFrequency } from "@/lib/types"
import { CostBuCard } from "@/components/financeiro/cost-bu-card"

export default async function CentralCustoPage() {
  const supabase = await createClient()

  const [
    { data: businessUnits },
    { data: rules },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name, slug, type").eq("is_active", true),
    supabase
      .from("v_cost_rules")
      .select("id, business_unit_id, frequency, last_amount")
      .eq("is_active", true),
  ])

  type RuleRow = {
    id: string
    business_unit_id: string
    frequency: CostFrequency
    last_amount: number | null
  }

  const rulesByBu = (rules as RuleRow[] ?? []).reduce<Record<string, RuleRow[]>>((acc, r) => {
    if (!acc[r.business_unit_id]) acc[r.business_unit_id] = []
    acc[r.business_unit_id].push(r)
    return acc
  }, {})

  const bus = (businessUnits as BusinessUnit[]) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Central de Custo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Regras de auto-classificação por unidade de negócio. Clique numa BU para gerenciar os custos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {bus.map((bu) => (
          <CostBuCard key={bu.id} bu={bu} rules={rulesByBu[bu.id] ?? []} />
        ))}
        {bus.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-4">Nenhuma BU cadastrada.</p>
        )}
      </div>
    </div>
  )
}
