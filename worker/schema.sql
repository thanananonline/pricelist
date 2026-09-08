CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  cat TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  price REAL NOT NULL,
  oldPrice REAL,
  price2 REAL,
  price3 REAL,
  unit TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  vat TEXT NOT NULL DEFAULT 'vat',
  image TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories (
  value TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  size_label TEXT NOT NULL,
  r2_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
);

-- Concrete pipe price lists (see migrations/0004_add_pipe_pricing.sql):
-- kept separate from `products` because each item carries a full 10-tier
-- discount ladder (3%-30%, ex-VAT/inc-VAT) plus weight/load specs that don't
-- fit the generic product form.
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

-- Solid floor plank price lists (see migrations/0006_add_plank_pricing.sql):
-- same reasoning as pipe_products above, kept separate because the shape
-- differs (priced per sq.m., no weight/load specs, 2%-7% discount ladder in
-- 2 tiers instead of pipe's 3%-30% in 3 tiers).
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

-- TNN precast fence price list (see migrations/0008_add_fence_pricing.sql):
-- no discount ladder at all -- single price per piece -- so unlike
-- pipe_products/plank_products there is no matching *_discounts table.
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

-- Ready-mixed concrete price list (see
-- migrations/0010_add_concrete_mix_pricing.sql): no discount ladder, and
-- only the two base prices are stored -- the four VAT/no-VAT prices shown on
-- screen are always derived from retail_base/wholesale_base at render time.
-- slump (see migrations/0012_add_concrete_mix_slump.sql) is a free-text spec
-- field, not involved in any price calculation.
CREATE TABLE IF NOT EXISTS concrete_mix_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cube TEXT,
  cyl TEXT,
  code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  retail_base REAL NOT NULL,
  wholesale_base REAL NOT NULL,
  slump TEXT NOT NULL DEFAULT '7.5 +/- 2.5'
);

-- Pile price list (see migrations/0013_add_pile_pricing.sql): grouped into
-- three shapes (SQ/I/HEX) via grp, no discount ladder. Only the four base
-- (no-VAT) prices are stored -- the matching VAT-inclusive prices shown on
-- screen are always derived from them at render time. area_sqcm is nullable
-- because hexagonal piles have no cross-section-area spec.
CREATE TABLE IF NOT EXISTS pile_products (
  id TEXT PRIMARY KEY,
  grp TEXT NOT NULL,
  name TEXT NOT NULL,
  area_sqcm REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  price_pickup REAL NOT NULL,
  price_201_500plus REAL NOT NULL,
  price_101_201 REAL NOT NULL,
  price_under_100 REAL NOT NULL
);
