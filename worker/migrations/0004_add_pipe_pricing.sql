-- Run once against the existing (already-deployed) D1 database.
-- Adds dedicated tables for concrete pipe price lists, which have a much
-- richer structure than the generic `products` table (a full 3%-30%
-- discount ladder per ex-VAT/inc-VAT, plus weight/load-capacity specs) and
-- are not meant to be edited through the generic product form. Kept
-- separate from `products` on purpose -- see the design discussion for
-- concrete_pipe_prices.json import.
CREATE TABLE IF NOT EXISTS pipe_products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  size_cm TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  list_exvat REAL NOT NULL,
  list_incvat REAL NOT NULL,
  weight_kg_per_pipe REAL,
  load_10wheel_pipes INTEGER,
  load_trailer_pipes INTEGER
);

CREATE TABLE IF NOT EXISTS pipe_discounts (
  pipe_product_id TEXT NOT NULL REFERENCES pipe_products(id),
  percent INTEGER NOT NULL,
  exvat REAL NOT NULL,
  incvat REAL NOT NULL,
  PRIMARY KEY (pipe_product_id, percent)
);
