-- Run once against the existing (already-deployed) D1 database.
-- Changes the 60x60x90 manhole (for 30 cm pipe, 6 cm wall, 6mm rebar) from
-- "standard" to "ECO". Only the variant label changes; id and prices stay
-- the same so nothing else that references this row breaks.
UPDATE manhole_products SET variant = 'ECO' WHERE id = 'manhole-1-60x60x90-standard-6mm';
