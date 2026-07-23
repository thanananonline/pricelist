INSERT OR IGNORE INTO contacts (id, name, department, phone, address) VALUES
  ('seed1', 'คุณสมชาย ใจดี', 'ฝ่ายขาย', '081-234-5678', '99/1 ถนนสุขาภิบาล ตำบลบางพลี อำเภอบางพลี จังหวัดสมุทรปราการ 10540');

INSERT OR IGNORE INTO users (username, password, role) VALUES
  ('admin', '1234', 'admin'),
  ('test', '1234', 'viewer');
