import { createClient } from "@/lib/supabase/server"
import { TransactionsClient } from "@/components/financeiro/transactions-client"

export default async function LancamentosPage() {
  const supabase = await createClient()

  const [
    { data: transactions },
    { data: businessUnits },
    { data: categories },
    { data: bankAccounts },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select(`
        *,
        business_units(id, name),
        transaction_categories(id, name, type),
        bank_accounts(id, bank_name)
      `)
      .order("transaction_date", { ascending: false })
      .limit(200),
    supabase.from("business_units").select("id, name, slug").eq("is_active", true),
    supabase.from("transaction_categories").select("id, name, type").eq("is_active", true).order("type").order("name"),
    supabase.from("bank_accounts").select("id, bank_name").eq("is_active", true),
  ])

  return (
    <TransactionsClient
      initialTransactions={transactions ?? []}
      businessUnits={businessUnits ?? []}
      categories={categories ?? []}
      bankAccounts={bankAccounts ?? []}
    />
  )
}
