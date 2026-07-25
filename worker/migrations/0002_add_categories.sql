-- Run once against the existing (already-deployed) D1 database. Moves the
-- product category list out of the frontend's hardcoded array and into the
-- database so admins can add new categories from the dashboard. Seeds the
-- rows with the same value/label pairs the frontend previously hardcoded,
-- so existing products.cat values keep resolving to the same labels.
CREATE TABLE IF NOT EXISTS categories (
  value TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO categories (value, label, sort_order) VALUES
  ('concrete_pipe', 'ผลิตภัณฑ์คอนกรีต - ท่อ', 0),
  ('concrete_manhole', 'ผลิตภัณฑ์คอนกรีต - บ่อพัก', 1),
  ('concrete_pile', 'ผลิตภัณฑ์คอนกรีต - เสาเข็ม', 2),
  ('concrete_slab', 'ผลิตภัณฑ์คอนกรีต - แผ่นพื้น', 3),
  ('cement', 'ปูนถุง', 4),
  ('steel', 'เหล็กเส้น / เหล็กรูปพรรณ', 5);
