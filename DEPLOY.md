# Deploy ke Vercel — VINCENT WORLD MULTI

Satu project Vercel: frontend (Vite) + API Express (`api/index.js`) + database Supabase.

## 1. Database (Supabase)
Jika tabel belum ada: Supabase → SQL Editor → jalankan `supabase/migrations/00001_create_schema.sql`
(membuat tabel + user `admin`). Tidak perlu password database / `DATABASE_URL` — backend memakai REST API Supabase.

## 2. Import ke Vercel
- **Root Directory:** `./`
- **Application Preset:** `Other` (JANGAN "Services"; build diatur oleh `vercel.json`)
- Build/Output/Install command biarkan default — sudah diisi `vercel.json`.

## 3. Environment Variables (Production + Preview)
Paste isi `vercel.env` ke kolom Key di Settings → Environment Variables (Vercel otomatis memecah per baris).

| Key | Isi |
|---|---|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | env lama → langsung jalan (mode anon) |
| *atau* `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | mode disarankan (boleh jalankan `00002_enable_rls.sql`) |
| `SESSION_SECRET` | string acak ≥ 32 karakter (WAJIB) |
| `VITE_AUDIO_URL` | opsional — link audio `https://...` (publik) |

`VITE_*` ikut masuk bundle browser *jika dipakai kode frontend*; nilai `VITE_AUDIO_URL` memang publik. Ubah `VITE_AUDIO_URL` → **redeploy**.

## 4. Cek setelah deploy
- `/api/debug` → semua `has...` harus `true`
- `/api/healthz` → `{"status":"ok"}`
- `/api/healthz/db` → `{"ok":true,"keyMode":"anon",...}` (cek koneksi + tabel Supabase)
- Login admin seperti biasa (kredensial admin tidak diubah)
- Jika admin belum ada/rusak: `GET /api/seed-admin?secret=vw_seed_2026` sekali

## Lokal
```bash
pnpm install
cp .env.example .env.local   # isi SUPABASE_* dan SESSION_SECRET
pnpm --filter @workspace/api-server run build:vercel   # hasilkan api/index.js
pnpm --filter @workspace/dashboard run build
```
