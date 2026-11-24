-- ⚠️ OPSIONAL & HANYA jika backend memakai SUPABASE_SERVICE_ROLE_KEY.
-- Jika backend memakai ANON key (VITE_SUPABASE_ANON_KEY), JANGAN jalankan file
-- ini — RLS aktif tanpa policy akan membuat semua request API gagal.
-- Backend memakai SERVICE ROLE KEY (bypass RLS), jadi aman mengaktifkan RLS
-- tanpa policy: anon key (yang publik di frontend) tidak bisa baca/tulis
-- tabel ini sama sekali — termasuk kolom password_hash.
-- Jalankan di Supabase → SQL Editor. Idempotent.
ALTER TABLE "users"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tools_usage"    ENABLE ROW LEVEL SECURITY;
