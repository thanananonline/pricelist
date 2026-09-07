-- Run once against the existing (already-deployed) D1 database.
-- Adds dedicated tables for solid floor plank (แผ่นพื้นสำเร็จรูป) price
-- lists. Same reasoning as pipe_products/pipe_discounts (see
-- migrations/0004_add_pipe_pricing.sql): priced per unit with a discount
-- ladder, not meant to be edited through the generic product form. Kept as
-- its own tables (not merged into pipe_products) because the shape is
-- different -- priced per sq.m. instead of per pipe, no weight/load-capacity
-- specs, and a different discount ladder (2%-7% in 2 tiers vs pipe's
-- 3%-30% in 3 tiers) -- see plank_prices.json.
CREATE TABLE IF NOT EXISTS plank_products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  wire_count INTEGER NOT NULL,
  wire_spec TEXT NOT NULL,
  length_range TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  list_exvat REAL NOT NULL,
  list_incvat REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS plank_discounts (
  plank_product_id TEXT NOT NULL REFERENCES plank_products(id),
  percent INTEGER NOT NULL,
  exvat REAL NOT NULL,
  incvat REAL NOT NULL,
  PRIMARY KEY (plank_product_id, percent)
);
