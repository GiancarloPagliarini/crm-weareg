export type BusinessUnit = {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Partner = {
  id: string
  name: string
  email: string | null
  is_active: boolean
  created_at: string
}

export type PartnerShare = {
  id: string
  partner_id: string
  business_unit_id: string
  share_percentage: number
  effective_from: string
  effective_until: string | null
  created_at: string
}

export type BankAccount = {
  id: string
  bank_name: string
  account_type: string
  account_number: string | null
  agency: string | null
  initial_balance: number
  is_active: boolean
  created_at: string
}

export type TransactionCategory = {
  id: string
  name: string
  slug: string
  type: 'receita' | 'custo_direto' | 'despesa_operacional' | 'deducao' | 'investimento'
  parent_id: string | null
  is_active: boolean
  created_at: string
}

export type Transaction = {
  id: string
  business_unit_id: string
  category_id: string
  bank_account_id: string
  type: 'entrada' | 'saida'
  amount: number
  description: string
  transaction_date: string
  competence_date: string
  is_recurring: boolean
  recurring_frequency: string | null
  counterpart_name: string | null
  is_reconciled: boolean
  receipt_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joins
  business_units?: BusinessUnit
  transaction_categories?: TransactionCategory
  bank_accounts?: BankAccount
}

export type Receivable = {
  id: string
  business_unit_id: string
  counterpart_name: string
  description: string
  amount: number
  due_date: string
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  transaction_id: string | null
  created_at: string
}

export type BankBalance = {
  id: string
  bank_name: string
  initial_balance: number
  current_balance: number
  total_entradas: number
  total_saidas: number
}

export type DashboardKpis = {
  faturamento: number
  despesas_totais: number
  receita_liquida: number
  lucro_bruto: number
  lucro_liquido: number
  margem_bruta: number
  margem_liquida: number
}

export type DreRow = {
  line_item: string
  line_type: string
  amount: number
}

export type ProfitDistributionRow = {
  partner_name: string
  business_unit_name: string
  share_percentage: number
  bu_net_profit: number
  partner_profit: number
}
