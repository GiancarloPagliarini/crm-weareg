-- ============================================================
-- MIGRATION 07 — Trocar índice parcial por UNIQUE constraint
-- Rodar DEPOIS da 06.
-- ============================================================
--
-- A migration 06 criou um índice único PARCIAL (com WHERE fitid IS NOT NULL).
-- PostgREST/supabase-js não consegue casar `ON CONFLICT (bank_account_id, fitid)`
-- com índice parcial — falha com:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- Solução: substituir por UNIQUE CONSTRAINT não-parcial. Múltiplos NULLs em
-- `fitid` continuam permitidos porque o Postgres (default NULLS DISTINCT)
-- trata NULLs como não-iguais entre si, então lançamentos manuais sem FITID
-- não conflitam entre si.
-- ============================================================

DROP INDEX IF EXISTS uq_transactions_bank_fitid;

ALTER TABLE transactions
  ADD CONSTRAINT uq_transactions_bank_fitid
  UNIQUE (bank_account_id, fitid);
