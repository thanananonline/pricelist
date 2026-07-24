INSERT OR IGNORE INTO contacts (id, name, department, phone, address) VALUES
  ('seed1', 'คุณสมชาย ใจดี', 'ฝ่ายขาย', '081-234-5678', '99/1 ถนนสุขาภิบาล ตำบลบางพลี อำเภอบางพลี จังหวัดสมุทรปราการ 10540');

-- No demo user accounts are seeded here anymore: password_hash values can't
-- be produced in plain SQL, and shipping a known plaintext demo password
-- ("1234") in a committed file defeats the point of hashing it. To create
-- the first admin account, either:
--   1) call POST /auth/register (creates a "viewer"), then promote it to
--      "admin" via `UPDATE users SET role = 'admin' WHERE username = '...'`
--      through `wrangler d1 execute`, or
--   2) run `node worker/scripts/hash-password.mjs '<your password>'` to get
--      a password_hash value, then insert it directly:
--      wrangler d1 execute thananan-pricelist-db --remote --command \
--        "INSERT INTO users (username, password_hash, role) VALUES ('admin', '<hash>', 'admin')"
