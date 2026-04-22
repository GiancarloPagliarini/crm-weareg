-- ============================================================
-- MIGRATION 08 — Central de Custo (regras de auto-classificação)
-- Rodar DEPOIS da 07.
-- ============================================================
--
-- `cost_rules` é um cadastro de custos recorrentes. Cada regra casa
-- com transações futuras cuja `description` contenha `match_text`
-- (case-insensitive), e pré-aplica BU + categoria + frequência.
--
-- `transactions.cost_rule_id` liga a transação à regra que a classificou.
-- ============================================================

-- 1. Tabela de regras
CREATE TABLE IF NOT EXISTS cost_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_text TEXT NOT NULL,
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  category_id UUID NOT NULL REFERENCES transaction_categories(id),
  frequency TEXT NOT NULL CHECK (frequency IN ('diario', 'semanal', 'quinzenal', 'mensal', 'anual')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_rules_bu       ON cost_rules(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_cost_rules_category ON cost_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_cost_rules_active   ON cost_rules(is_active);

-- Unicidade por match_text (evita duas regras conflitantes pra mesma string)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cost_rules_match_text
  ON cost_rules(LOWER(match_text)) WHERE is_active = true;

-- 2. Ligação opcional na tabela transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS cost_rule_id UUID REFERENCES cost_rules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_cost_rule ON transactions(cost_rule_id);

-- 3. RLS — consistente com o resto do módulo (CRM interno)
ALTER TABLE cost_rules DISABLE ROW LEVEL SECURITY;

-- 4. View: regras + último valor lançado por essa regra
-- Usada na Central de Custo para calcular o total mensal normalizado.
CREATE OR REPLACE VIEW v_cost_rules AS
SELECT
  cr.id,
  cr.match_text,
  cr.business_unit_id,
  cr.category_id,
  cr.frequency,
  cr.is_active,
  cr.created_at,
  cr.updated_at,
  latest.amount           AS last_amount,
  latest.transaction_date AS last_date
FROM cost_rules cr
LEFT JOIN LATERAL (
  SELECT t.amount, t.transaction_date
  FROM transactions t
  WHERE t.cost_rule_id = cr.id
  ORDER BY t.transaction_date DESC
  LIMIT 1
) latest ON true;
