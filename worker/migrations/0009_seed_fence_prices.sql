-- Run once against the existing (already-deployed) D1 database.
-- Seeds fence_products from fence_prices.json (7 items, no discount tiers).
-- Source: แค็ตตาล็อกราคา TNN Classic Fence -- บริษัท ธนานันท์ฮาร์ดแวร์ จำกัด
-- (effective 1 ก.ค. 2567). Prices are ไม่รวม VAT 7%.

INSERT OR IGNORE INTO fence_products
  (id, type, length, sort_order, price_exvat, price_incvat, weight_kg_per_piece, sheets_per_length, coping_pieces)
VALUES
  ('fence-0', 'เสารั้ว 15x15 ซม. (สำหรับรั้วสูง 1.5 ม.)', '1.8 ม.', 0, 350, 374.5, 85, 5, 1),
  ('fence-1', 'เสารั้ว 15x15 ซม. (สำหรับรั้วสูง 2 ม.)', '2.3 ม.', 1, 390, 417.3, 100, 7, 1),
  ('fence-2', 'เสารั้ว 15x15 ซม. (สำหรับรั้วสูง 2.5 ม.)', '2.8 ม.', 2, 440, 470.8, 115, 9, 1),
  ('fence-3', 'เสารั้ว 15x15 ซม. (สำหรับรั้วสูง 3 ม.)', '3.3 ม.', 3, 530, 567.1, 145, 11, 1),
  ('fence-4', 'แผ่นรั้ว 25x5 ซม.', '2.92 ม.', 4, 325, 347.75, 95, NULL, NULL),
  ('fence-5', 'คานทับหลัง 25x5 ซม.', '2.92 ม.', 5, 420, 449.4, 130, NULL, NULL),
  ('fence-6', 'ฟุตติ้งสำเร็จ 0.56x0.56x0.50 ม. หนา 8 ซม.', NULL, 6, 700, 749.0, 195, NULL, NULL);
