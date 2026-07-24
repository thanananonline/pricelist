-- Run once against the existing (already-deployed) D1 database to add the
-- new column. Keeps the legacy `password` column in place so that
-- POST /internal/migrate-passwords can hash the existing plaintext values;
-- that endpoint drops the legacy column itself once migration succeeds.
ALTER TABLE users ADD COLUMN password_hash TEXT;
