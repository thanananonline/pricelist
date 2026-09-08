-- Run once against the existing (already-deployed) D1 database.
-- Adds a slump spec column to concrete_mix_products (see
-- migrations/0010_add_concrete_mix_pricing.sql). All 12 current items share
-- the same target slump (7.5 +/- 2.5 ซม.) per the original ภาคตะวันตก price
-- sheet -- a NOT NULL DEFAULT backfills every existing row as part of the
-- ALTER itself, so there's no separate UPDATE/seed statement needed and no
-- existing row (price or otherwise) is touched.
ALTER TABLE concrete_mix_products ADD COLUMN slump TEXT NOT NULL DEFAULT '7.5 +/- 2.5';
