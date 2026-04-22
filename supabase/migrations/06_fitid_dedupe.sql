-- ============================================================
-- MIGRATION 06 — Deduplicação de importações OFX por FITID
-- Rodar DEPOIS das migrations 01-05
-- ============================================================
--
-- Antes dessa migration, o FITID do OFX era gravado apenas como
-- texto em `notes`. Qualquer reimport duplicava as transações.
--
-- Esta migration:
--   1. Adiciona a coluna `fitid`.
--   2. Faz backfill a partir das notes ("FITID: xxx") dos imports antigos.
--   3. Detecta e aborta se existirem duplicatas pré-existentes (precisam
--      ser resolvidas manualmente antes do índice único).
--   4. Cria índice único parcial (bank_account_id, fitid) onde fitid IS NOT NULL.
-- ============================================================

-- 1. Coluna
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fitid TEXT;

-- 2. Backfill a partir das notes ("Importado via OFX | FITID: xxxx")
UPDATE transactions
SET fitid = substring(notes FROM 'FITID:\s*([^\s|]+)')
WHERE fitid IS NULL
  AND notes LIKE '%FITID:%';

-- 3. Abortar se já existem duplicatas (precisam ser limpas antes)
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT bank_account_id, fitid
    FROM transactions
    WHERE fitid IS NOT NULL
    GROUP BY bank_account_id, fitid
    HAVING COUNT(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'Existem % par(es) (bank_account_id, fitid) duplicados. Limpe antes de criar o índice único. Use a query de diagnóstico no rodapé deste arquivo.',
      dup_count;
  END IF;
END $$;

-- 4. Índice único parcial
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_bank_fitid
  ON transactions(bank_account_id, fitid)
  WHERE fitid IS NOT NULL;

-- ============================================================
-- QUERIES DE APOIO (NÃO EXECUTAM — só para referência)
-- ============================================================
--
-- Listar duplicatas:
--   SELECT bank_account_id, fitid, COUNT(*), array_agg(id)
--   FROM transactions
--   WHERE fitid IS NOT NULL
--   GROUP BY bank_account_id, fitid
--   HAVING COUNT(*) > 1;
--
-- Apagar duplicatas mantendo a mais antiga de cada (bank_account_id, fitid):
--   DELETE FROM transactions t
--   USING (
--     SELECT id,
--            ROW_NUMBER() OVER (
--              PARTITION BY bank_account_id, fitid
--              ORDER BY created_at ASC
--            ) AS rn
--     FROM transactions
--     WHERE fitid IS NOT NULL
--   ) d
--   WHERE t.id = d.id AND d.rn > 1;
