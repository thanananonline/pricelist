-- Run once against the existing (already-deployed) D1 database.
-- Lets folders nest inside other folders of the same kind. NULL = top-level,
-- so every folder that existed before this migration stays top-level.
ALTER TABLE folders ADD COLUMN parent_id TEXT;
