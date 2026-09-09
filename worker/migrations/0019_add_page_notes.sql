-- Run once against the existing (already-deployed) D1 database.
-- Adds page_notes, a small key-value table holding the free-text
-- "หมายเหตุ" block shown above the table on each product price page
-- (pipe/plank/fence/concrete_mix/pile/box_culvert/manhole). Previously the
-- pile/box_culvert/manhole notes were hardcoded strings in
-- dashboard.html's renderPilePage/renderBoxCulvertPage/renderManholePage;
-- this migration seeds page_notes with that exact existing text so nothing
-- visibly changes, and now every page's note is editable by an admin via
-- the web UI (PUT /page-notes/:key) instead of requiring a code change.
CREATE TABLE IF NOT EXISTS page_notes (
  page_key TEXT PRIMARY KEY,
  note TEXT NOT NULL DEFAULT ''
);

INSERT INTO page_notes (page_key, note) VALUES
  ('pipe', ''),
  ('plank', ''),
  ('fence', ''),
  ('concrete_mix', ''),
  ('pile', 'ราคาต่อเมตร ยังไม่รวม VAT 7%
ไม่ใช้กับเสาเข็มเสริมเหล็กพิเศษ
เริ่มใช้ 15 เม.ย. 2569'),
  ('box_culvert', 'ราคาต่อท่อน (ยาว 1 ม.) ยังไม่รวม VAT 7% ไม่มีขั้นส่วนลด
เริ่มใช้ราคานี้ตั้งแต่ 1 มีนาคม 2564'),
  ('manhole', 'ราคาที่แสดงเป็นบ่อพักแบบ 2 ทางตรง ยังไม่รวม VAT 7% ไม่มีขั้นส่วนลด
สำหรับแบบ 3 ทาง, ฉาก, หรือ 1 ทาง เพิ่มใบละ 100 บาท (ยกเว้นรายการที่ระบุชนิดเป็น 3-way ซึ่งมีราคาเฉพาะอยู่แล้ว)
บ่อพักสามารถสั่งผลิตล่วงหน้าได้ ตามความต้องการหรือตามแบบของแต่ละโครงการ
เริ่มใช้ราคานี้ตั้งแต่ 8 พฤษภาคม 2569');
