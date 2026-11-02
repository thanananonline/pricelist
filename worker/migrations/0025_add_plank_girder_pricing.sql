-- Run once against the existing (already-deployed) D1 database.
-- Adds tables for the Plank Girder price list, imported from
-- data/plank-girder-prices.json. VAT-inclusive prices are derived at render
-- time as round(base * 1.07), so they aren't stored. price_ext_sidewalk100 is
-- NULL for ทล. rows, which have no 1.00 ม. sidewalk beam.
-- Each standard's note lives on plank_girder_standards rather than page_notes
-- because GET /page-notes is public and this tab's note requires login.
CREATE TABLE IF NOT EXISTS plank_girder_standards (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  drawings TEXT NOT NULL,
  section TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plank_girder_products (
  id TEXT PRIMARY KEY,
  standard_key TEXT NOT NULL,
  length_m REAL NOT NULL,
  height_m REAL NOT NULL,
  weight_ton REAL NOT NULL,
  price_int REAL NOT NULL,
  price_ext_barrier REAL NOT NULL,
  price_ext_sidewalk100 REAL,
  price_ext_sidewalk150 REAL NOT NULL,
  per_trip_trailer18 INTEGER,
  per_trip_10wheel INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);
