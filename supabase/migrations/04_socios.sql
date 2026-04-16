-- ============================================================
-- MIGRATION 04 — Sócios e participações societárias
-- ============================================================

-- Sócios
INSERT INTO partners (name, email) VALUES
  ('Gustavo Gomes',        'gustavo@weareg.com.br'),
  ('Giancarlo Pagliarini', 'giancarlo@weareg.com.br'),
  ('Geovani Rosa',         'geovani@weareg.com.br')
ON CONFLICT DO NOTHING;

-- ── Gustagoat: 50% Gustavo | 25% Giancarlo | 25% Geovani ──
INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 50   FROM partners p, business_units bu WHERE p.name = 'Gustavo Gomes'        AND bu.slug = 'gustagoat'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 25   FROM partners p, business_units bu WHERE p.name = 'Giancarlo Pagliarini' AND bu.slug = 'gustagoat'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 25   FROM partners p, business_units bu WHERE p.name = 'Geovani Rosa'         AND bu.slug = 'gustagoat'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

-- ── WeAreG: 33.33% cada (Giancarlo leva o 0.01 restante) ──
INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 33.33 FROM partners p, business_units bu WHERE p.name = 'Gustavo Gomes'        AND bu.slug = 'weareg'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 33.34 FROM partners p, business_units bu WHERE p.name = 'Giancarlo Pagliarini' AND bu.slug = 'weareg'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 33.33 FROM partners p, business_units bu WHERE p.name = 'Geovani Rosa'         AND bu.slug = 'weareg'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

-- ── GeraEW.ia: 33.33% cada (Giancarlo leva o 0.01 restante) ──
INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 33.33 FROM partners p, business_units bu WHERE p.name = 'Gustavo Gomes'        AND bu.slug = 'geraewia'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 33.34 FROM partners p, business_units bu WHERE p.name = 'Giancarlo Pagliarini' AND bu.slug = 'geraewia'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 33.33 FROM partners p, business_units bu WHERE p.name = 'Geovani Rosa'         AND bu.slug = 'geraewia'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

-- ── Gustagoat B2B: 50% Gustavo | 25% Giancarlo | 25% Geovani ──
INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 50   FROM partners p, business_units bu WHERE p.name = 'Gustavo Gomes'        AND bu.slug = 'gustagoat-b2b'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 25   FROM partners p, business_units bu WHERE p.name = 'Giancarlo Pagliarini' AND bu.slug = 'gustagoat-b2b'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;

INSERT INTO partner_shares (partner_id, business_unit_id, share_percentage)
SELECT p.id, bu.id, 25   FROM partners p, business_units bu WHERE p.name = 'Geovani Rosa'         AND bu.slug = 'gustagoat-b2b'
ON CONFLICT (partner_id, business_unit_id, effective_from) DO UPDATE SET share_percentage = EXCLUDED.share_percentage;
