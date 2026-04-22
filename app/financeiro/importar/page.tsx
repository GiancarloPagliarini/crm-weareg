import { createClient } from "@/lib/supabase/server"
import { OFXImportClient } from "@/components/financeiro/ofx-import"

export default async function ImportarPage() {
  const supabase = await createClient()

  const [
    { data: businessUnits },
    { data: categories },
    { data: bankAccounts },
    { data: costRules },
  ] = await Promise.all([
    supabase.from("business_units").select("id, name").eq("is_active", true),
    supabase.from("transaction_categories").select("id, name, type").eq("is_active", true).order("type").order("name"),
    supabase.from("bank_accounts").select("id, bank_name").eq("is_active", true),
    supabase
      .from("cost_rules")
      .select("id, match_text, business_unit_id, category_id, frequency")
      .eq("is_active", true),
  ])

  return (
    <OFXImportClient
      businessUnits={businessUnits ?? []}
      categories={categories ?? []}
      bankAccounts={bankAccounts ?? []}
      costRules={costRules ?? []}
    />
  )
}
