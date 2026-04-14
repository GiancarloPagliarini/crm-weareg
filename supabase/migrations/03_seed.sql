-- ============================================================
-- MIGRATION 03 — Seed de dados iniciais
-- Rodar DEPOIS das migrations 01 e 02
-- ============================================================

-- Categorias de transação
INSERT INTO transaction_categories (name, slug, type) VALUES
  ('Receita de serviço',       'receita-servico',       'receita'),
  ('Receita de produto',       'receita-produto',       'receita'),
  ('Receita de assinatura',    'receita-assinatura',    'receita'),
  ('Funcionários',             'funcionarios',          'custo_direto'),
  ('APIs / Tokens / GPUs',     'apis-tokens',           'custo_direto'),
  ('Plataformas de pagamento', 'plataformas-pagamento', 'custo_direto'),
  ('Tráfego pago',             'trafego-pago',          'despesa_operacional'),
  ('Infraestrutura',           'infraestrutura',        'despesa_operacional'),
  ('Softwares e ferramentas',  'softwares',             'despesa_operacional'),
  ('Outras despesas',          'outras-despesas',       'despesa_operacional'),
  ('Impostos sobre receita',   'impostos-receita',      'deducao'),
  ('Equipamentos',             'equipamentos',          'investimento')
ON CONFLICT (slug) DO NOTHING;

-- Unidades de negócio
INSERT INTO business_units (name, slug, type, description) VALUES
  ('Gustagoat',        'gustagoat',        'educacao',  'Educação / Infoproduto — Lançamentos e vendas perpétuas'),
  ('WeAreG',           'weareg',           'servicos',  'Serviços / Automação — Setups e mensalidades recorrentes'),
  ('GeraEW.ia',        'geraewia',         'saas',      'SaaS / Produto — Assinaturas mensais'),
  ('Gustagoat B2B',    'gustagoat-b2b',    'agencia',   'Agência — Projetos customizados de vídeo e IA')
ON CONFLICT (slug) DO NOTHING;

-- Contas bancárias
INSERT INTO bank_accounts (bank_name, account_type, initial_balance) VALUES
  ('C6 Bank',   'corrente', 0),
  ('Santander', 'corrente', 0)
ON CONFLICT DO NOTHING;
