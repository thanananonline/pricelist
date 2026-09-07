-- Run once against the existing (already-deployed) D1 database.
-- Adds a table for TNN precast fence (รั้วสำเร็จรูป TNN คอนกรีตเสริมเหล็กอัดแรง)
-- price list. Unlike pipe_products/plank_products (see
-- migrations/0004_add_pipe_pricing.sql, 0006_add_plank_pricing.sql), this
-- category has no discount ladder at all -- each item is a single price per
-- piece -- so there is no matching fence_discounts table. Spec columns
-- (length, sheets_per_length, coping_pieces) are nullable because not every
-- item type carries every spec (e.g. footings have no length/sheet count).
CREATE TABLE IF NOT EXISTS fence_products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  length TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  price_exvat REAL NOT NULL,
  price_incvat REAL NOT NULL,
  weight_kg_per_piece REAL,
  sheets_per_length INTEGER,
  coping_pieces INTEGER
);
