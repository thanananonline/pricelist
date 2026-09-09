-- Run once against the existing (already-deployed) D1 database.
-- Adds a table for บ่อพักสำเร็จรูป (precast manhole) price list, imported
-- from data/precast-manhole-prices.json. Like box_culvert_products there is
-- no discount ladder; unlike box_culvert_products there are three
-- independent ไม่รวม VAT prices per row (price_pickup/price_wholesale/
-- price_retail, matching price_columns in the source file) instead of two --
-- the matching VAT-inclusive prices shown on screen are always derived at
-- render time as base * 1.07 (rounded), same formula as
-- box_culvert_products (see migrations/0015_add_box_culvert_pricing.sql).
-- variant distinguishes multiple product types at the same manhole_size
-- (standard/ECO/3-way/ECO 3-way -- see items[].variant in the source file).
CREATE TABLE IF NOT EXISTS manhole_products (
  id TEXT PRIMARY KEY,
  group_no INTEGER NOT NULL,
  for_pipe_cm REAL NOT NULL,
  manhole_size TEXT NOT NULL,
  wall_thickness_cm REAL,
  rebar TEXT,
  variant TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  price_pickup REAL NOT NULL,
  price_wholesale REAL NOT NULL,
  price_retail REAL NOT NULL
);
