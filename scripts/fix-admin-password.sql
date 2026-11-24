-- ================================================================
-- FIX: Update password_hash admin ke hash SHA256 yang benar
-- Backend menggunakan SHA256(password + "pvincent_salt_2025")
-- ================================================================

UPDATE "users"
SET "password_hash" = '2f58ecd66c1dc28ab003295a2476c3325af31de92aef900eaf729291c5d3394d'
WHERE "username" = 'admin';
