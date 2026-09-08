-- Run once against the existing (already-deployed) D1 database.
-- Adds a table for pile (เสาเข็ม) price list, grouped into three shapes --
-- SQ, I, and hexagonal (HEX). Like fence_products (see
-- migrations/0008_add_fence_pricing.sql) there is no discount ladder here;
-- unlike fence_products, only the four base (ยังไม่รวม VAT, ตามใบ) prices
-- are stored -- the matching VAT-inclusive prices shown on screen are always
-- derived at render time as base * 1.07 (rounded), so there is nothing else
-- to store. area_sqcm is nullable because hexagonal piles have no
-- cross-section-area spec on the price sheet.
CREATE TABLE IF NOT EXISTS pile_products (
  id TEXT PRIMARY KEY,
  grp TEXT NOT NULL,
  name TEXT NOT NULL,
  area_sqcm REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  price_pickup REAL NOT NULL,
  price_201_500plus REAL NOT NULL,
  price_101_201 REAL NOT NULL,
  price_under_100 REAL NOT NULL
);
