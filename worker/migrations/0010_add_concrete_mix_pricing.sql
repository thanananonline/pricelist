-- Run once against the existing (already-deployed) D1 database.
-- Adds a table for ready-mixed concrete (คอนกรีตผสมเสร็จ ภาคตะวันตก) price
-- list. Like fence_products (see migrations/0008_add_fence_pricing.sql),
-- there is no discount ladder here -- just one price per item -- so no
-- matching *_discounts table. Unlike fence_products, only the two base
-- prices are stored: retail_base and wholesale_base. The four prices shown
-- on screen (retail/wholesale, VAT/no-VAT) are always derived from those at
-- render time with a fixed formula (VAT = base * 1.07 rounded; no-VAT =
-- that minus 50 -- see concrete_prices.json's own "ราคา = ตาราง×1.07" note),
-- so there is nothing to store beyond the two bases.
CREATE TABLE IF NOT EXISTS concrete_mix_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cube TEXT,
  cyl TEXT,
  code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  retail_base REAL NOT NULL,
  wholesale_base REAL NOT NULL
);
