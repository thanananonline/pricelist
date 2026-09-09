-- Run once against the existing (already-deployed) D1 database.
-- Seeds manhole_products from data/precast-manhole-prices.json (20 items
-- across 8 size groups, effective 8/5/2569). price_pickup/price_wholesale/
-- price_retail are the "ไม่รวม VAT" prices exactly as given in the source
-- file; the VAT-inclusive prices shown on screen are derived at render time
-- as price * 1.07 (rounded), same formula as box_culvert_products (see
-- migrations/0016_seed_box_culvert_prices.sql), so nothing else is stored.
--
-- id is built from group_no + manhole_size + variant + rebar (not a plain
-- sequence number like other seed migrations) because several rows share
-- the same manhole_size within a group (standard vs ECO vs 3-way vs
-- ECO 3-way variants at the same size) -- verified by hand that all 20
-- resulting ids are distinct before writing this file.
INSERT OR IGNORE INTO manhole_products
  (id, group_no, for_pipe_cm, manhole_size, wall_thickness_cm, rebar, variant, sort_order, price_pickup, price_wholesale, price_retail)
VALUES
  ('manhole-1-60x60x90-standard-6mm', 1, 30, '60x60x90', 6, '6mm', 'standard', 1, 950, 1100, 1200),
  ('manhole-1-70x70x90-standard-9mm', 1, 30, '70x70x90', 10, '9mm', 'standard', 2, 1550, 1700, 1800),
  ('manhole-2-70x75x90-standard-9mm', 2, 40, '70x75x90', 8, '9mm', 'standard', 3, 1500, 1650, 1750),
  ('manhole-2-70x75x90-eco-6mm', 2, 40, '70x75x90', 8, '6mm', 'ECO', 4, 1350, 1550, 1650),
  ('manhole-2-80x80x100-standard-9mm', 2, 40, '80x80x100', 10, '9mm', 'standard', 5, 1800, 1950, 2050),
  ('manhole-3-90x90x100-standard-9mm', 3, 50, '90x90x100', 10, '9mm', 'standard', 6, 2000, 2200, 2300),
  ('manhole-4-100x100x110-standard-9mm', 4, 60, '100x100x110', 10, '9mm', 'standard', 7, 2500, 2700, 2800),
  ('manhole-4-100x100x110-eco-6mm', 4, 60, '100x100x110', 10, '6mm', 'ECO', 8, 2400, 2550, 2650),
  ('manhole-5-120x120x150-standard-9mm', 5, 80, '120x120x150', 10, '9mm', 'standard', 9, 3300, 3600, 3700),
  ('manhole-5-120x120x150-eco-6mm', 5, 80, '120x120x150', 10, '6mm', 'ECO', 10, 2900, 3200, 3300),
  ('manhole-6-130x150x170-standard-12mm', 6, 100, '130x150x170', 15, '12mm', 'standard', 11, 5900, 6400, 6800),
  ('manhole-6-150x150x170-3-way-12mm', 6, 100, '150x150x170', 15, '12mm', '3-way', 12, 6400, 7200, 7600),
  ('manhole-6-130x150x170-eco-9mm', 6, 100, '130x150x170', 15, '9mm', 'ECO', 13, 5500, 6000, 6400),
  ('manhole-6-150x150x170-eco-3-way-9mm', 6, 100, '150x150x170', 15, '9mm', 'ECO 3-way', 14, 6000, 6500, 7000),
  ('manhole-7-180x120x210-standard-12mm', 7, 120, '180x120x210', 15, '12mm', 'standard', 15, 7500, 9000, 9500),
  ('manhole-7-180x180x210-3-way-12mm', 7, 120, '180x180x210', 15, '12mm', '3-way', 16, 8500, 10000, 10500),
  ('manhole-7-180x120x210-eco-9mm', 7, 120, '180x120x210', 15, '9mm', 'ECO', 17, 7000, 8500, 9000),
  ('manhole-7-180x180x210-eco-3-way-9mm', 7, 120, '180x180x210', 15, '9mm', 'ECO 3-way', 18, 8100, 9600, 10000),
  ('manhole-8-230x120x240-standard-12mm', 8, 150, '230x120x240', 15, '12mm', 'standard', 19, 12000, 16000, 20000),
  ('manhole-8-230x230x240-3-way-12mm', 8, 150, '230x230x240', 15, '12mm', '3-way', 20, 14000, 18000, 22000);
