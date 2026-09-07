-- Run once against the existing (already-deployed) D1 database.
-- Seeds plank_products + plank_discounts from plank_prices.json
-- (5 wire-count types, 6 discount tiers each, 2%-7%).
-- Source: ราคาตั้งแผ่นพื้น_ฝ่ายขาย_15-07-69.pdf (effective 15 เม.ย. 2569).
-- Spec: แผ่นพื้นสำเร็จรูป กว้าง 35 ซม. หนา 5 ซม. มอก.828-2546, ราคาต่อ ตร.ม.

INSERT OR IGNORE INTO plank_products
  (id, type, wire_count, wire_spec, length_range, sort_order, list_exvat, list_incvat)
VALUES
  ('plank-0', 'แผ่นพื้น 4 เส้น', 4, 'P.C.wire 4 mm', 'ไม่เกิน 3.00 ม.', 0, 240, 256.8),
  ('plank-1', 'แผ่นพื้น 5 เส้น', 5, 'P.C.wire 4 mm', '3.00-4.00 ม.', 1, 250, 267.5),
  ('plank-2', 'แผ่นพื้น 6 เส้น', 6, 'P.C.wire 4 mm', '4.00-4.20 ม.', 2, 260, 278.2),
  ('plank-3', 'แผ่นพื้น 7 เส้น', 7, 'P.C.wire 4 mm', '4.00-5.00 ม.', 3, 275, 294.25),
  ('plank-4', 'แผ่นพื้น 8 เส้น', 8, 'P.C.wire 4 mm', '4.50-5.00 ม.', 4, 290, 310.3);

INSERT OR IGNORE INTO plank_discounts (plank_product_id, percent, exvat, incvat)
VALUES
  ('plank-0', 2, 235, 251.45),
  ('plank-0', 3, 233, 249.31),
  ('plank-0', 4, 230, 246.1),
  ('plank-0', 5, 228, 243.96),
  ('plank-0', 6, 226, 241.82),
  ('plank-0', 7, 223, 238.61),
  ('plank-1', 2, 245, 262.15),
  ('plank-1', 3, 243, 260.01),
  ('plank-1', 4, 240, 256.8),
  ('plank-1', 5, 238, 254.66),
  ('plank-1', 6, 235, 251.45),
  ('plank-1', 7, 233, 249.31),
  ('plank-2', 2, 255, 272.85),
  ('plank-2', 3, 252, 269.64),
  ('plank-2', 4, 250, 267.5),
  ('plank-2', 5, 247, 264.29),
  ('plank-2', 6, 244, 261.08),
  ('plank-2', 7, 242, 258.94),
  ('plank-3', 2, 270, 288.9),
  ('plank-3', 3, 267, 285.69),
  ('plank-3', 4, 264, 282.48),
  ('plank-3', 5, 261, 279.27),
  ('plank-3', 6, 259, 277.13),
  ('plank-3', 7, 256, 273.92),
  ('plank-4', 2, 284, 303.88),
  ('plank-4', 3, 281, 300.67),
  ('plank-4', 4, 278, 297.46),
  ('plank-4', 5, 276, 295.32),
  ('plank-4', 6, 273, 292.11),
  ('plank-4', 7, 270, 288.9);
