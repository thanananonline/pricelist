-- Run once against the existing (already-deployed) D1 database.
-- Seeds concrete_mix_products from concrete_prices.json (12 items, ภาคตะวันตก
-- price list effective 2026-05-07). That file only has the four derived
-- prices (retail/wholesale, VAT/no-VAT); retail_base/wholesale_base here are
-- reverse-derived from retail_vat/wholesale_vat with the same formula the
-- frontend uses going forward (base = round(vat / 1.07)), and round-tripping
-- every row back through base*1.07 (rounded) and that minus 50 reproduces
-- the original four prices in concrete_prices.json exactly.
INSERT OR IGNORE INTO concrete_mix_products
  (id, name, cube, cyl, code, sort_order, retail_base, wholesale_base)
VALUES
  ('concrete-mix-0', 'คอนกรีตหยาบ (Lean)', '-', '-', '84071002', 0, 1764, 1714),
  ('concrete-mix-1', 'คอนกรีต 180', '180', '140', '84181002', 1, 1869, 1816),
  ('concrete-mix-2', 'คอนกรีต 210', '210', '180', '84211002', 2, 1911, 1856),
  ('concrete-mix-3', 'คอนกรีต 240', '240', '210', '84241002', 3, 1953, 1897),
  ('concrete-mix-4', 'คอนกรีต 280', '280', '240', '84281002', 4, 1995, 1938),
  ('concrete-mix-5', 'คอนกรีต 300', '300', '250', '84301002', 5, 2037, 1979),
  ('concrete-mix-6', 'คอนกรีต 320', '320', '280', '84321002', 6, 2093, 2033),
  ('concrete-mix-7', 'คอนกรีต 350', '350', '300', '84351002', 7, 2149, 2088),
  ('concrete-mix-8', 'คอนกรีต 380', '380', '320', '84381002', 8, 2205, 2142),
  ('concrete-mix-9', 'คอนกรีต 400', '400', '350', '84401002', 9, 2275, 2210),
  ('concrete-mix-10', 'คอนกรีต 420', '420', '380', '84421002', 10, 2345, 2278),
  ('concrete-mix-11', 'คอนกรีต 450', '450', '400', '84451002', 11, 2415, 2346);
