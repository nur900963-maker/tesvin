# Deploy ke Vercel — VINCENT WORLD MULTI

Semua setting ada di FILE (tanpa env Vercel):
- Server (Supabase + session): `artifacts/api-server/src/secret.config.ts`
- Audio: `artifacts/dashboard/src/config.ts` → konstanta `AUDIO_URL` (player ada di samping jam)

⚠️ `secret.config.ts` berisi kunci → repo GitHub harus **Private**.
Setelah edit file config, `api/index.js` dibangun ulang otomatis saat deploy (buildCommand di `vercel.json`).

## Vercel
- Root Directory `./` — Application Preset **Other** (bukan "Services")
- Build/Output/Install sudah diatur `vercel.json`. Env var tidak wajib.

## Database
Tabel belum ada? Supabase → SQL Editor → jalankan `supabase/migrations/00001_create_schema.sql`.
(`00002_enable_rls.sql` HANYA jika `SUPABASE_KEY` diisi service-role key.)

## Cek setelah deploy
- `/api/healthz/db` → `{"ok":true,...}`
- Login `admin` (kredensial tidak diubah). Jika baris admin hilang / hash beda, otomatis diperbaiki saat login dengan password admin yang benar.
- Gagal login → notif merah sekarang menampilkan alasan (mis. "Server error: Invalid API key").
