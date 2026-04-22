import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { BusinessUnit, TransactionCategory, CostFrequency } from "@/lib/types"
import { CostRulesClient } from "@/components/financeiro/cost-rules-client"

type Props = {
  params: Promise<{ buId: string }>
}

export type CostRuleRow = {
  id: string
  match_text: string
  business_unit_id: string
  category_id: string
  frequency: CostFrequency
  is_active: boolean
  last_amount: number | null
  last_date: string | null
  transaction_categories: { id: string; name: string; type: string } | null
}

export default async function CentralCustoBuPage({ params }: Props) {
  const { buId } = await params
  const supabase = await createClient()

  const [
    { data: bu },
    { data: rules },
    { data: categories },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name, slug, type").eq("id", buId).maybeSingle(),
    supabase
      .from("v_cost_rules")
      .select(`
        id, match_text, business_unit_id, category_id, frequency, is_active,
        last_amount, last_date,
        transaction_categories:category_id(id, name, type)
      `)
      .eq("business_unit_id", buId)
      .eq("is_active", true)
      .order("match_text"),
    supabase
      .from("transaction_categories")
      .select("id, name, type")
      .eq("is_active", true)
      .order("type")
      .order("name"),
  ])

  if (!bu) notFound()

  return (
    <CostRulesClient
      bu={bu as BusinessUnit}
      initialRules={(rules as unknown as CostRuleRow[]) ?? []}
      categories={(categories as Pick<TransactionCategory, "id" | "name" | "type">[]) ?? []}
    />
  )
}
