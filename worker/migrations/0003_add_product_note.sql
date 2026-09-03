-- Run once against the existing (already-deployed) D1 database.
-- Adds a free-text note field to products, shown below the product name
-- on the price list.
ALTER TABLE products ADD COLUMN note TEXT NOT NULL DEFAULT '';
