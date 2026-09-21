-- Run once against the existing (already-deployed) D1 database.
-- Adds an optional, free-text subcategory label to products (e.g. under
-- "กระเบื้องหลังคา": ADAMAS, CT, ลอนคู่, จตุลอน). There is no master table
-- for subcategory values -- like the note field, it's just a string on the
-- product row, and the dashboard derives its autocomplete suggestions from
-- whatever values already exist for a given cat. This keeps the feature
-- generic: any category can start using subcategories just by having
-- products with a shared subcat label, no schema or config change needed.
ALTER TABLE products ADD COLUMN subcat TEXT NOT NULL DEFAULT '';
