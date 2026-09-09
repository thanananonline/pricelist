-- Run once against the existing (already-deployed) D1 database.
-- Adds a table for ท่อเหลี่ยม (box culvert) price list, imported from
-- concrete-box-culvert-prices.json. Like fence_products/pile_products there
-- is no discount ladder and no groups (one flat list of 6 sizes). Unlike
-- fence_products, only the two "ไม่รวม VAT" base prices per row are stored
-- (price_mok1164, price_mok1166 -- one column per มอก. standard, since the
-- source price sheet lists two independent prices per size rather than a
-- single price) -- the matching VAT-inclusive prices shown on screen are
-- always derived at render time as base * 1.07 (rounded), same formula as
-- pile_products (see migrations/0013_add_pile_pricing.sql), so there is
-- nothing else to store.
CREATE TABLE IF NOT EXISTS box_culvert_products (
  id TEXT PRIMARY KEY,
  size TEXT NOT NULL,
  width_cm REAL NOT NULL,
  height_cm REAL NOT NULL,
  thickness_cm REAL NOT NULL,
  weight_kg REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  price_mok1164 REAL NOT NULL,
  price_mok1166 REAL NOT NULL
);
