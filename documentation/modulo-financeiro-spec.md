# Módulo Financeiro — Especificação Técnica para Backend

> **Projeto:** CRM interno — Gestão financeira multi-BU
> **Data:** Abril 2026
> **Stack sugerida:** Supabase (PostgreSQL) + API REST/Edge Functions
> **Status:** Spec v1 — aguardando validação dos sócios

---

## 1. Visão geral

O módulo financeiro é o core do CRM. Ele controla **entradas e saídas** de duas contas bancárias (C6 e Santander), distribuídas entre 4 unidades de negócio (BUs) com composições societárias independentes. O sistema deve calcular automaticamente faturamento, lucro bruto, lucro líquido e a distribuição de lucro por sócio.

### 1.1 Unidades de negócio (BUs)

| BU | Tipo | Principal fonte de receita | Principal custo |
|---|---|---|---|
| Gustagoat | Educação / Infoproduto | Lançamentos e vendas perpétuas | Tráfego pago, comissões de plataforma |
| WeAreG | Serviços / Automação | Setups + mensalidades recorrentes | Infraestrutura (APIs, servidores) |
| GeraEW.ia | SaaS / Produto | Assinaturas mensais | Tokens de IA, GPUs, P&D |
| Gustagoat B2B | Agência | Projetos customizados (vídeo/AI) | Mão de obra variável (freelancers) |

### 1.2 Contas bancárias

| Banco | Tipo | Uso principal |
|---|---|---|
| C6 Bank | Conta corrente PJ | Recebimentos e operações |
| Santander | Conta corrente PJ | Pagamentos e reserva |

---

## 2. Schema do banco de dados

### 2.1 Tabela `business_units`

Cadastro das unidades de negócio.

```sql
CREATE TABLE business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Ex: "Gustagoat"
  slug TEXT NOT NULL UNIQUE,             -- Ex: "gustagoat"
  type TEXT NOT NULL,                    -- Ex: "educacao", "servicos", "saas", "agencia"
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Tabela `partners`

Cadastro dos sócios.

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Ex: "Geovani"
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Tabela `partner_shares`

Participação de cada sócio em cada BU. Permite composições diferentes por BU.

```sql
CREATE TABLE partner_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  share_percentage NUMERIC(5,2) NOT NULL CHECK (share_percentage >= 0 AND share_percentage <= 100),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,                  -- NULL = vigente
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, business_unit_id, effective_from)
);

-- Constraint: soma dos percentuais por BU deve ser 100%
-- Implementar via trigger ou validação na Edge Function
```

### 2.4 Tabela `bank_accounts`

Contas bancárias da empresa.

```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,               -- Ex: "C6 Bank", "Santander"
  account_type TEXT NOT NULL DEFAULT 'corrente', -- corrente, poupanca, investimento
  account_number TEXT,
  agency TEXT,
  initial_balance NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.5 Tabela `transaction_categories`

Categorias para classificar lançamentos.

```sql
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Ex: "Funcionários", "Infraestrutura / APIs"
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('receita', 'custo_direto', 'despesa_operacional', 'deducao', 'investimento')),
  -- receita:              entra no faturamento bruto
  -- custo_direto:         abate do lucro bruto (CPV)
  -- despesa_operacional:  abate do lucro líquido (OPEX)
  -- deducao:              impostos sobre receita
  -- investimento:         não entra na DRE mensal (CAPEX)
  parent_id UUID REFERENCES transaction_categories(id), -- para subcategorias
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Categorias iniciais sugeridas:**

| Categoria | Tipo | Exemplos |
|---|---|---|
| Receita de serviço | receita | Setup WeAreG, projeto B2B |
| Receita de produto | receita | Assinatura GeraEW.ia, venda Gustagoat |
| Funcionários | custo_direto | Pagamento editores, freelancers |
| APIs / Tokens / GPUs | custo_direto | Vertex AI, OpenAI, Supabase |
| Plataformas de pagamento | custo_direto | Hotmart, Kiwifi, Stripe |
| Tráfego pago | despesa_operacional | Meta Ads, Google Ads |
| Infraestrutura | despesa_operacional | Servidores, domínios, ferramentas |
| Softwares e ferramentas | despesa_operacional | SaaS internos, licenças |
| Impostos sobre receita | deducao | Simples Nacional, ISS, etc. |
| Equipamentos | investimento | Câmeras, computadores |

### 2.6 Tabela `transactions` (tabela principal)

Todos os lançamentos financeiros — entradas e saídas.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Classificação
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  category_id UUID NOT NULL REFERENCES transaction_categories(id),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  
  -- Dados do lançamento
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),  -- sempre positivo, o `type` define o sinal
  description TEXT NOT NULL,
  
  -- Datas
  transaction_date DATE NOT NULL,         -- data efetiva da movimentação
  competence_date DATE NOT NULL,          -- data de competência (mês contábil)
  
  -- Recorrência e controle
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,               -- 'mensal', 'semanal', 'anual'
  
  -- Vínculo com cliente/fornecedor (opcional, para CRM futuro)
  counterpart_name TEXT,                  -- Ex: "Hubi9", "Meta Ads", "Editor João"
  
  -- Controle de conciliação
  is_reconciled BOOLEAN DEFAULT false,    -- marcado quando conferido com extrato
  receipt_url TEXT,                        -- link para comprovante (Supabase Storage)
  
  -- Metadata
  notes TEXT,
  created_by UUID,                        -- quem registrou
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices essenciais
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_bu ON transactions(business_unit_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_competence ON transactions(competence_date);
CREATE INDEX idx_transactions_bank ON transactions(bank_account_id);
```

### 2.7 Tabela `receivables` (contas a receber)

Para controle de faturamento pendente.

```sql
CREATE TABLE receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  counterpart_name TEXT NOT NULL,         -- cliente
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  transaction_id UUID REFERENCES transactions(id), -- vincula quando pago
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Views e cálculos (SQL)

### 3.1 Saldo por conta bancária

```sql
CREATE OR REPLACE VIEW v_bank_balances AS
SELECT
  ba.id,
  ba.bank_name,
  ba.initial_balance,
  ba.initial_balance + COALESCE(SUM(
    CASE WHEN t.type = 'entrada' THEN t.amount ELSE -t.amount END
  ), 0) AS current_balance,
  COALESCE(SUM(CASE WHEN t.type = 'entrada' THEN t.amount ELSE 0 END), 0) AS total_entradas,
  COALESCE(SUM(CASE WHEN t.type = 'saida' THEN t.amount ELSE 0 END), 0) AS total_saidas
FROM bank_accounts ba
LEFT JOIN transactions t ON t.bank_account_id = ba.id
GROUP BY ba.id, ba.bank_name, ba.initial_balance;
```

### 3.2 DRE gerencial por período

```sql
CREATE OR REPLACE FUNCTION fn_dre(
  p_start_date DATE,
  p_end_date DATE,
  p_business_unit_id UUID DEFAULT NULL  -- NULL = consolidado
)
RETURNS TABLE (
  line_item TEXT,
  line_type TEXT,
  amount NUMERIC(12,2)
) AS $$
BEGIN
  RETURN QUERY

  -- Receita bruta
  SELECT 'Receita bruta'::TEXT, 'receita'::TEXT,
    COALESCE(SUM(t.amount), 0)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'entrada'
    AND c.type = 'receita'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)

  UNION ALL

  -- Deduções (impostos sobre receita)
  SELECT '(-) Deduções'::TEXT, 'deducao'::TEXT,
    -COALESCE(SUM(t.amount), 0)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'saida'
    AND c.type = 'deducao'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)

  UNION ALL

  -- Custos diretos (CPV)
  SELECT '(-) Custos diretos'::TEXT, 'custo_direto'::TEXT,
    -COALESCE(SUM(t.amount), 0)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'saida'
    AND c.type = 'custo_direto'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)

  UNION ALL

  -- Despesas operacionais (OPEX)
  SELECT '(-) Despesas operacionais'::TEXT, 'despesa_operacional'::TEXT,
    -COALESCE(SUM(t.amount), 0)
  FROM transactions t
  JOIN transaction_categories c ON c.id = t.category_id
  WHERE t.type = 'saida'
    AND c.type = 'despesa_operacional'
    AND t.competence_date BETWEEN p_start_date AND p_end_date
    AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id);

END;
$$ LANGUAGE plpgsql;
```

**Uso:**
```sql
-- DRE consolidado de abril 2026
SELECT * FROM fn_dre('2026-04-01', '2026-04-30');

-- DRE só da WeAreG
SELECT * FROM fn_dre('2026-04-01', '2026-04-30', 'uuid-da-weareg');
```

**Cálculos derivados (no frontend ou edge function):**
- `Receita líquida = Receita bruta + Deduções`
- `Lucro bruto = Receita líquida + Custos diretos`
- `Lucro líquido = Lucro bruto + Despesas operacionais`
- `Margem bruta = Lucro bruto / Receita líquida × 100`
- `Margem líquida = Lucro líquido / Receita líquida × 100`

### 3.3 Distribuição de lucro por sócio

```sql
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
      SUM(CASE WHEN t.type = 'entrada' THEN t.amount ELSE -t.amount END) AS net_profit
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
```

### 3.4 KPIs para o dashboard

```sql
CREATE OR REPLACE FUNCTION fn_dashboard_kpis(
  p_start_date DATE,
  p_end_date DATE,
  p_business_unit_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH current_period AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.type = 'entrada' AND c.type = 'receita' THEN t.amount ELSE 0 END), 0) AS faturamento,
      COALESCE(SUM(CASE WHEN t.type = 'saida' THEN t.amount ELSE 0 END), 0) AS despesas_totais,
      COALESCE(SUM(CASE WHEN t.type = 'saida' AND c.type = 'deducao' THEN t.amount ELSE 0 END), 0) AS deducoes,
      COALESCE(SUM(CASE WHEN t.type = 'saida' AND c.type = 'custo_direto' THEN t.amount ELSE 0 END), 0) AS custos_diretos,
      COALESCE(SUM(CASE WHEN t.type = 'saida' AND c.type = 'despesa_operacional' THEN t.amount ELSE 0 END), 0) AS despesas_op
    FROM transactions t
    JOIN transaction_categories c ON c.id = t.category_id
    WHERE t.competence_date BETWEEN p_start_date AND p_end_date
      AND (p_business_unit_id IS NULL OR t.business_unit_id = p_business_unit_id)
  )
  SELECT json_build_object(
    'faturamento', cp.faturamento,
    'despesas_totais', cp.despesas_totais,
    'receita_liquida', cp.faturamento - cp.deducoes,
    'lucro_bruto', cp.faturamento - cp.deducoes - cp.custos_diretos,
    'lucro_liquido', cp.faturamento - cp.deducoes - cp.custos_diretos - cp.despesas_op,
    'margem_bruta', CASE WHEN cp.faturamento > 0
      THEN ROUND(((cp.faturamento - cp.deducoes - cp.custos_diretos) / (cp.faturamento - cp.deducoes)) * 100, 1)
      ELSE 0 END,
    'margem_liquida', CASE WHEN cp.faturamento > 0
      THEN ROUND(((cp.faturamento - cp.deducoes - cp.custos_diretos - cp.despesas_op) / (cp.faturamento - cp.deducoes)) * 100, 1)
      ELSE 0 END
  ) INTO result
  FROM current_period cp;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Endpoints da API (Edge Functions / REST)

### 4.1 Dashboard

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/dashboard/kpis?start=2026-04-01&end=2026-04-30&bu=all` | KPIs consolidados ou por BU |
| GET | `/api/dashboard/bank-balances` | Saldo atual de cada conta |
| GET | `/api/dashboard/revenue-by-bu?start=...&end=...` | Receita, custo e margem por BU |
| GET | `/api/dashboard/expenses-breakdown?start=...&end=...` | Despesas agrupadas por categoria |
| GET | `/api/dashboard/monthly-chart?months=6` | Dados para gráfico entradas vs saídas |

### 4.2 Lançamentos (CRUD)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/transactions?page=1&limit=20&type=saida&bu=weareg&bank=c6&category=funcionarios` | Lista com filtros e paginação |
| POST | `/api/transactions` | Criar novo lançamento |
| PUT | `/api/transactions/:id` | Editar lançamento |
| DELETE | `/api/transactions/:id` | Excluir lançamento (soft delete) |
| PATCH | `/api/transactions/:id/reconcile` | Marcar como conciliado |

### 4.3 DRE

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/dre?start=2026-04-01&end=2026-04-30&bu=all` | DRE gerencial do período |
| GET | `/api/dre/compare?current=2026-04&previous=2026-03` | Comparativo entre períodos |

### 4.4 Sócios

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/partners/profit-distribution?start=...&end=...` | Distribuição de lucro calculada |
| GET | `/api/partners` | Lista de sócios |
| PUT | `/api/partner-shares/:bu_id` | Atualizar percentuais de uma BU |

### 4.5 Contas a receber

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/receivables?status=pendente` | Faturas pendentes |
| POST | `/api/receivables` | Registrar nova conta a receber |
| PATCH | `/api/receivables/:id/mark-paid` | Marcar como pago (vincula transaction_id) |

---

## 5. Regras de negócio críticas

### 5.1 Lançamentos
- Todo lançamento **deve** ter uma BU, uma categoria e uma conta bancária
- O campo `amount` é sempre **positivo** — o `type` (entrada/saida) define o sinal
- `transaction_date` é quando o dinheiro movimentou; `competence_date` é o mês contábil (pode ser diferente)
- Lançamentos recorrentes devem gerar automaticamente os lançamentos futuros (cron job ou edge function agendada)

### 5.2 DRE
- O DRE é calculado pela `competence_date`, não pela `transaction_date`
- Ordem de cálculo: Receita bruta → (-) Deduções = Receita líquida → (-) Custos diretos = Lucro bruto → (-) Despesas operacionais = Lucro líquido
- Investimentos (CAPEX) **não** entram na DRE mensal

### 5.3 Distribuição de lucro
- Cada BU tem sua própria composição societária em `partner_shares`
- O campo `effective_from` / `effective_until` permite histórico de mudanças na participação
- A distribuição é calculada sobre o **lucro líquido de cada BU**, não sobre o consolidado
- Validação: a soma dos `share_percentage` de uma BU deve ser exatamente 100%

### 5.4 Saldos bancários
- Saldo atual = `initial_balance` + soma de entradas − soma de saídas
- Saldo total = soma dos saldos de todas as contas ativas

---

## 6. Categorias de despesa pré-cadastradas

```sql
INSERT INTO transaction_categories (name, slug, type) VALUES
  ('Receita de serviço', 'receita-servico', 'receita'),
  ('Receita de produto', 'receita-produto', 'receita'),
  ('Receita de assinatura', 'receita-assinatura', 'receita'),
  ('Funcionários', 'funcionarios', 'custo_direto'),
  ('APIs / Tokens / GPUs', 'apis-tokens', 'custo_direto'),
  ('Plataformas de pagamento', 'plataformas-pagamento', 'custo_direto'),
  ('Tráfego pago', 'trafego-pago', 'despesa_operacional'),
  ('Infraestrutura (servidores)', 'infraestrutura', 'despesa_operacional'),
  ('Softwares e ferramentas', 'softwares', 'despesa_operacional'),
  ('Outras despesas', 'outras-despesas', 'despesa_operacional'),
  ('Impostos sobre receita', 'impostos-receita', 'deducao'),
  ('Equipamentos', 'equipamentos', 'investimento');
```

---

## 7. Correspondência tela ↔ dados

| Elemento da tela | Fonte de dados |
|---|---|
| KPI — Saldo total | `v_bank_balances` (soma current_balance) |
| KPI — Faturamento | `fn_dashboard_kpis` → faturamento |
| KPI — Lucro bruto | `fn_dashboard_kpis` → lucro_bruto |
| KPI — Lucro líquido | `fn_dashboard_kpis` → lucro_liquido |
| KPI — Despesas totais | `fn_dashboard_kpis` → despesas_totais |
| KPI — A receber | `receivables` WHERE status = 'pendente' (SUM amount) |
| Cards de banco | `v_bank_balances` por conta |
| Cards de BU | `fn_dashboard_kpis` filtrado por BU |
| Gráfico barras mensal | `fn_dashboard_kpis` chamado para cada mês |
| Composição de despesas | Transactions agrupadas por category, filtradas por tipo saida |
| Donut BU | Transactions agrupadas por BU, filtradas por tipo saida |
| Aba DRE | `fn_dre` |
| Aba Lançamentos | `transactions` com JOINs para BU, category, bank_account |
| Aba Sócios | `fn_profit_distribution` |

---

## 8. Próximos passos

1. **Validar** as BUs reais e percentuais de cada sócio
2. **Criar** o schema no Supabase (copiar os CREATEs acima)
3. **Semear** categorias e dados de exemplo
4. **Implementar** Edge Functions para os endpoints
5. **Conectar** o frontend (ver arquivo HTML do wireframe)

> **Nota:** Este spec cobre a Fase 1 (financeiro core). Integrações bancárias via API, previsão de fluxo de caixa e módulo de impostos ficam para fases futuras.
