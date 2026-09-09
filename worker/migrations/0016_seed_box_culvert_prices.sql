-- Run once against the existing (already-deployed) D1 database.
-- Seeds box_culvert_products from concrete-box-culvert-prices.json (6 sizes,
-- effective 1 มี.ค. 2564). price_mok1164/price_mok1166 are the "ไม่รวม VAT"
-- prices exactly as given in the source file; the VAT-inclusive prices shown
-- on screen are derived at render time as price * 1.07 (rounded), same
-- formula as pile_products (see migrations/0014_seed_pile_prices.sql), so
-- nothing else is stored.
INSERT OR IGNORE INTO box_culvert_products
  (id, size, width_cm, height_cm, thickness_cm, weight_kg, sort_order, price_mok1164, price_mok1166)
VALUES
  ('boxculvert-1', '120x120', 120, 120, 12.5, 1750, 1, 4200, 4500),
  ('boxculvert-2', '150x150', 150, 150, 15, 2800, 2, 5200, 6500),
  ('boxculvert-3', '180x180', 180, 180, 17.5, 3650, 3, 7800, 8300),
  ('boxculvert-4', '210x210', 210, 210, 20, 4800, 4, 9900, 11500),
  ('boxculvert-5', '210x240', 210, 240, 20, 5500, 5, 11500, 13000),
  ('boxculvert-6', '240x240', 240, 240, 20, 6500, 6, 13000, 14500);
