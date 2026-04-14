-- ============================================================
-- MIGRATION 02 — Views e Functions do módulo financeiro
-- Rodar DEPOIS da migration 01
-- ============================================================

-- View: saldo por conta bancária
CREATE OR REPLACE VIEW v_bank_balances AS
SELECT
  ba.id,
  ba.bank_name,
  ba.initial_balance,
  ba.initial_balance + COALESCE(SUM(
    CASE WHEN t.type = 'entrada' THEN t.amount ELSE -t.amount END
  ), 0) AS current_balance,
  COALESCE(SUM(CASE WHEN t.type = 'entrada' THEN t.amount ELSE 0 END), 0) AS total_entradas,
  COALESCE(SUM(CASE WHEN t.type = 'saida'   THEN t.amount ELSE 0 END), 0) AS total_saidas
FROM bank_accounts ba
LEFT JOIN transactions t ON t.bank_account_id = ba.id
GROUP BY ba.id, ba.bank_name, ba.initial_balance;

-- Function: DRE gerencial por período
CREATE OR REPLACE FUNCTION fn_dre(
  p_start_date DATE,
  p_end_date DATE,
  p_business_unit_id UUID DEFAULT NULL
)
RETURNS TABLE (
  line_item TEXT,
  line_type TEXT,
  amount NUMERIC(12,2)
) AS $$
BEGIN
  RETURN QUERY

  SELECT 'Receita bruta'::TEXT, 'receita'::TEXT,
    COALESCE(SUM(t.amount), 0)::NUMERIC(12,2)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'entrada'
    AND c.type = 'receita'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)

  UNION ALL

  SELECT '(-) Deduções'::TEXT, 'deducao'::TEXT,
    -COALESCE(SUM(t.amount), 0)::NUMERIC(12,2)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'saida'
    AND c.type = 'deducao'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)

  UNION ALL

  SELECT '(-) Custos diretos'::TEXT, 'custo_direto'::TEXT,
    -COALESCE(SUM(t.amount), 0)::NUMERIC(12,2)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'saida'
    AND c.type = 'custo_direto'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)

  UNION ALL

  SELECT '(-) Despesas operacionais'::TEXT, 'despesa_operacional'::TEXT,
    -COALESCE(SUM(t.amount), 0)::NUMERIC(12,2)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'saida'
    AND c.type = 'despesa_operacional'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id);

END;
$$ LANGUAGE plpgsql;

-- Function: distribuição de lucro por sócio
CREATE OR REPLACE FUNCTION fn_profit_distribution(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  partner_name TEXT,
  business_unit_name TEXT,
  share_percentage NUMERIC(5,2),
  bu_net_profit NUMERIC(12,2),
  partner_profit NUMERIC(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH bu_profits AS (
    SELECT
      t.business_unit_id,
      SUM(CASE WHEN t.type = 'entrada' THEN t.amount ELSE -t.amount END)::NUMERIC(12,2) AS net_profit
    FROM transactions t
    JOIN transaction_categories c ON c.id = t.category_id
    WHERE c.type != 'investimento'
      AND t.competence_date BETWEEN p_start_date AND p_end_date
    GROUP BY t.business_unit_id
  )
  SELECT
    p.name,
    bu.name,
    ps.share_percentage,
    bp.net_profit,
    ROUND(bp.net_profit * ps.share_percentage / 100, 2)
  FROM bu_profits bp
  JOIN business_units bu ON bu.id = bp.business_unit_id
  JOIN partner_shares ps ON ps.business_unit_id = bu.id
    AND ps.effective_from <= p_end_date
    AND (ps.effective_until IS NULL OR ps.effective_until >= p_start_date)
  JOIN partners p ON p.id = ps.partner_id
  ORDER BY p.name, bu.name;
END;
$$ LANGUAGE plpgsql;

-- Function: KPIs para o dashboard
CREATE OR REPLACE FUNCTION fn_dashboard_kpis(
  p_start_date DATE,
  p_end_date DATE,
  p_business_unit_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH cp AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.type = 'entrada' AND c.type = 'receita'             THEN t.amount ELSE 0 END), 0) AS faturamento,
      COALESCE(SUM(CASE WHEN t.type = 'saida'                                       THEN t.amount ELSE 0 END), 0) AS despesas_totais,
      COALESCE(SUM(CASE WHEN t.type = 'saida'   AND c.type = 'deducao'             THEN t.amount ELSE 0 END), 0) AS deducoes,
      COALESCE(SUM(CASE WHEN t.type = 'saida'   AND c.type = 'custo_direto'        THEN t.amount ELSE 0 END), 0) AS custos_diretos,
      COALESCE(SUM(CASE WHEN t.type = 'saida'   AND c.type = 'despesa_operacional' THEN t.amount ELSE 0 END), 0) AS despesas_op
    FROM transactions t
    JOIN transaction_categories c ON c.id = t.category_id
    WHERE t.competence_date BETWEEN p_start_date AND p_end_date
      AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)
  )
  SELECT json_build_object(
    'faturamento',     cp.faturamento,
    'despesas_totais', cp.despesas_totais,
    'receita_liquida', cp.faturamento - cp.deducoes,
    'lucro_bruto',     cp.faturamento - cp.deducoes - cp.custos_diretos,
    'lucro_liquido',   cp.faturamento - cp.deducoes - cp.custos_diretos - cp.despesas_op,
    'margem_bruta', CASE WHEN cp.faturamento > 0
      THEN ROUND(((cp.faturamento - cp.deducoes - cp.custos_diretos) / NULLIF(cp.faturamento - cp.deducoes, 0)) * 100, 1)
      ELSE 0 END,
    'margem_liquida', CASE WHEN cp.faturamento > 0
      THEN ROUND(((cp.faturamento - cp.deducoes - cp.custos_diretos - cp.despesas_op) / NULLIF(cp.faturamento - cp.deducoes, 0)) * 100, 1)
      ELSE 0 END
  ) INTO result
  FROM cp;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
