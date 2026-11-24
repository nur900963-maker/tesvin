# 🚀 VINCENT WORLD MULTI — Panduan Deploy ke Vercel

## Status
| Komponen | Status |
|----------|--------|
| ✅ Supabase Database | Sudah aktif & ter-migrasi |
| ⏳ Deploy Vercel | Butuh 2 langkah manual |

---

## Database (Sudah Siap!)

Project Supabase sudah dibuat:
- **URL:** https://esitvrwkdppauvwkkxeg.supabase.co
- **Region:** us-west-1
- **Tables:** `users`, `activity_logs`, `tools_usage` — semua sudah dimigrasi
- **Default user:** `admin` (role admin, status active)

---

## Langkah Deploy ke Vercel

### 1. Siapkan Password Database

Buka [Supabase Dashboard](https://supabase.com/dashboard/project/esitvrwkdppauvwkkxeg) → **Project Settings** → **Database** → klik **Reset password** (atau gunakan password yang sudah ada).

Copy password tersebut, lalu ganti `YOUR_DB_PASSWORD` di file `.env` baris `DATABASE_URL`.

Contoh setelah diganti:
```
DATABASE_URL=postgresql://postgres.esitvrwkdppauvwkkxeg:passwordAsli123@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Import ke Vercel

1. Push repo ini ke GitHub:
```bash
git init
git add .
git commit -m "deploy: vincent world dashboard"
git remote add origin https://github.com/USERNAME/vincent-world.git
git push -u origin main
```

2. Buka [vercel.com](https://vercel.com) → **Add New Project**
3. Import repo GitHub-mu
4. Vercel akan otomatis detect config dari `vercel.json`

### 3. Environment Variables di Vercel

Masuk ke **Project Settings** → **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://postgres.esitvrwkdppauvwkkxeg:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `SESSION_SECRET` | Random string panjang (min 32 karakter) |

### 4. Deploy!

Klik **Deploy** — Vercel akan:
- Build frontend (React + Vite)
- Build API serverless function (Express)
- Semua otomatis dari `vercel.json`

---

## 🔑 Login Credentials

Setelah deploy berhasil, login dengan:
- **Username:** `admin`
- **Password:** (lihat dari seed data yang kamu set saat migrasi — default belum di-set, kamu perlu update password_hash langsung di Supabase SQL Editor, atau buat user baru via API)

> 💡 **Tips:** Jalankan query ini di Supabase SQL Editor untuk set password admin:
```sql
UPDATE "users" SET "password_hash" = '$2b$10$abcdefghijklmnopqrstu.vwxyzABCDEFGHIJKLMNO' WHERE "username" = 'admin';
```

---

## 🛠️ API Endpoints

| Endpoint | Deskripsi |
|----------|-----------|
| `POST /api/auth/login` | Login |
| `POST /api/auth/register` | Register |
| `POST /api/tools/download` | Downloader (9 platform) |
| `POST /api/tools/ig-stalk` | IG Stalk |
| `POST /api/tools/dana` | Fake DANA |
| `POST /api/tools/ngl` | NGL Spam |
| `POST /api/tools/meta-bisnis` | Meta Bisnis |
| `POST /api/tools/nik-check` | NIK Check |
| `POST /api/tools/phone-lookup` | Phone Lookup |
| `POST /api/tools/stalk-*` | Stalker (7 platform) |
| `POST /api/tools/screenshot` | Screenshot |
| `POST /api/tools/translate` | Translate |
| `POST /api/tools/kodepos` | Kode Pos |
| `POST /api/tools/country-info` | Country Info |
| `POST /api/tools/subdomain-finder` | Subdomain Finder |
| `POST /api/tools/vcc-generator` | VCC |
| `POST /api/tools/pinterest-search` | Pinterest Search |
| `POST /api/tools/google-image` | Google Image |
| `POST /api/tools/youtube-search` | YouTube Search |
| `POST /api/tools/soundcloud-search` | SoundCloud Search |
| `POST /api/tools/kbbi` | KBBI |
| `POST /api/tools/ddg-search` | DuckDuckGo |
| `POST /api/tools/bing-image` | Bing Image |
| `POST /api/tools/cuaca` | Cuaca |
| `GET /api/tools/event-indonesia` | Event Indonesia |
| `GET /api/tools/jadwal-tv` | Jadwal TV |
| `GET /api/tools/bmkg-gempa` | BMKG Gempa |
| `POST /api/tools/textpro` | TextPro |
| `POST /api/tools/photooxy` | PhotoOxy |
| `POST /api/tools/ephoto360` | Ephoto360 |
| `POST /api/tools/brat` | Brat Generator |
| `POST /api/tools/chat-ai` | Chat AI |

---

## 🧪 Testing Local (Opsional)

```bash
# 1. Install dependencies
pnpm install

# 2. Set env vars (pastikan DATABASE_URL sudah benar)
cp .env .env.local

# 3. Jalankan backend
cd artifacts/api-server
pnpm build
PORT=3000 DATABASE_URL=... SESSION_SECRET=... node dist/index.mjs

# 4. Jalankan frontend (terminal baru)
cd artifacts/dashboard
pnpm dev
```

---

## 📝 File Penting yang Sudah Dibuat

| File | Tujuan |
|------|--------|
| `vercel.json` | Config deploy Vercel |
| `api/index.ts` | Serverless Express handler |
| `api/tsconfig.json` | TypeScript config untuk API |
| `.env` | Environment variables (sudah pre-config) |
| `DEPLOY.md` | Panduan deploy ini |

---

## ⚠️ Batasan Free Tier

- **Vercel Hobby:** 10 detik max function duration (cukup untuk semua tools)
- **Supabase Free:** 500MB DB, 100k requests/hari
- Untuk load tinggi, upgrade ke Vercel Pro + Supabase Pro
