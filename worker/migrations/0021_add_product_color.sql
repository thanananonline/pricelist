-- Run once against the existing (already-deployed) D1 database.
-- Adds an optional, free-text color to products, shown below the product
-- name on the price list. Color variants used to live in a trailing
-- "(...)" on the name (e.g. "... - กระเบื้อง (เทาปฐพี)"); once moved here
-- several products can share the same name, so the Excel upsert matches on
-- name + color instead of name alone.
ALTER TABLE products ADD COLUMN color TEXT NOT NULL DEFAULT '';
