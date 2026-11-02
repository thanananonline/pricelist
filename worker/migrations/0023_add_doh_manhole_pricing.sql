-- Run once against the existing (already-deployed) D1 database.
-- Adds a table for บ่อพักกรมทางหลวง (DOH-standard precast manhole) price list,
-- imported from data/doh-manhole-prices.json. Separate from manhole_products
-- (see migrations/0017_add_manhole_pricing.sql): different specs and six
-- independent ก่อน VAT prices per row (รับเอง/พร้อมจัดส่ง × ราคาตั้ง/ลด 5%/ลด 10%).
-- VAT-inclusive prices shown on screen are always derived at render time as
-- base * 1.07 (2 decimals, matching the source PDF), so they aren't stored.
-- A Type B "ฝา คสล. ครบชุด" add-on is its own row with parent_id set to its
-- manhole's id and sort_order right after it; it has cover_* dimensions and
-- no item_no/outer_*/wall_m/floor_m.
CREATE TABLE IF NOT EXISTS doh_manhole_products (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  item_no INTEGER,
  group_name TEXT NOT NULL,
  name TEXT NOT NULL,
  outer_w_m REAL,
  outer_l_m REAL,
  outer_h_m REAL,
  wall_m REAL,
  floor_m REAL,
  cover_pieces INTEGER,
  cover_piece_width_m REAL,
  cover_length_m REAL,
  cover_thickness_m REAL,
  weight_kg REAL,
  per_trip INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  pickup_list REAL NOT NULL,
  pickup_disc5 REAL NOT NULL,
  pickup_disc10 REAL NOT NULL,
  delivered_list REAL NOT NULL,
  delivered_disc5 REAL NOT NULL,
  delivered_disc10 REAL NOT NULL,
  spec_text TEXT
);
