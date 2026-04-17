-- ============================================================
-- MIGRATION 05 — Row Level Security (CRM interno)
-- Como é um CRM interno sem autenticação por usuário,
-- desabilitamos RLS nas tabelas financeiras para permitir
-- leitura/escrita via anon key.
-- ============================================================

ALTER TABLE business_units         DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners               DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_shares         DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts          DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions           DISABLE ROW LEVEL SECURITY;
ALTER TABLE receivables            DISABLE ROW LEVEL SECURITY;
