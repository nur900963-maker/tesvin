# VINCENT WORLD MULTI

Dashboard tools premium dengan role Admin & Reseller, integrasi API, simulasi tools, dan fitur manajemen user lengkap.

**Dev @pakvncnt | Channel: @testipakvncnt | Tools: PT Vincent**

---

## Login Admin Utama

| Field    | Value                       |
|----------|-----------------------------|
| Username | `admin`                     |
| Password | `#FFHUDT6O3jiQiSWxPo7eO`  |

---

## Fitur Utama

- **Role Admin & Reseller**: Admin bisa buat akun, kelola user, ban/unban, set expiry
- **14 Tools**: Download video, IG Stalk, Phone Lookup, Chat AI, NIK Check, NGL Spammer, Fake DANA, WhatsApp Badak, Meta Bisnis, Web Blast, dan lainnya
- **Anime Station**: Browse dan cari anime via Jikan API
- **Log Aktivitas**: Semua aksi user terekam di database
- **UI Dark Cyberpunk**: Mobile-first, responsive

---

## Stack

- **Frontend**: React + Vite (TypeScript)
- **Backend**: Express 5 + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **API Codegen**: Orval (OpenAPI)

---

## Deploy ke Vercel (Full Stack — Satu Project)

Frontend dan backend jalan di **satu project Vercel**. Tidak perlu Railway/Render.

### 1. Setup Database (Supabase)

Backend memakai **Supabase (Postgres)** lewat `@supabase/supabase-js`.

1. Jalankan `supabase/migrations/00001_create_schema.sql` di **Supabase → SQL Editor** (jika tabel belum ada).
2. Ambil **Project URL** + **anon key** (atau **service_role key**) di **Settings → API**. `00002_enable_rls.sql` hanya untuk mode service-role.

### 2. Environment Variables di Vercel

Buka **Project → Settings → Environment Variables** (Production + Preview):

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co   # env lama, langsung jalan
VITE_SUPABASE_ANON_KEY=...
# (disarankan) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY menggantikan dua baris di atas
SESSION_SECRET=random_string_panjang_minimal_32_karakter
VITE_AUDIO_URL=                      # opsional, link audio https://... (publik)
```

### 3. Deploy

```bash
# Build command (sudah diatur di vercel.json):
pnpm --filter @workspace/dashboard run build

# Output directory:
artifacts/dashboard/dist/public
```

`vercel.json` sudah mengarahkan `/api/*` ke serverless function `api/index.js`,
sehingga seluruh 59 endpoint API dan dashboard jalan dari satu domain.

### 4. Aktifkan Admin Utama (sekali saja)

Setelah deploy selesai, buka di browser:

```
https://<domain-kamu>.vercel.app/api/seed-admin?secret=vw_seed_2026
```

Harus muncul `{"ok":true,"action":"inserted"}`. Setelah itu login dengan
kredensial di bagian **Login Admin Utama** di atas.

> Endpoint ini idempoten: dipanggil lagi akan mengembalikan `action: "updated"`
dan tidak membuat duplikat. Kalau password admin pernah diubah dan kamu lupa,
panggil endpoint ini lagi untuk mengembalikannya ke password default.

### Alternatif: lewat script

```bash
GET https://<domain-kamu>/api/seed-admin?secret=vw_seed_2026
```

---

## Deploy ke Replit (Recommended — Paling Mudah)

Sudah langsung bisa deploy dari Replit! Klik tombol **Deploy** di Replit, semua otomatis tersambung.

---

## Buat Akun Reseller Baru

Login sebagai Admin → Sidebar → **Manajemen User** → tombol **BUAT AKUN**

Isi:
- **Username**: nama reseller
- **Password**: minimal 6 karakter (ada tombol mata untuk lihat/sembunyikan)
- **Role**: `user`, `reseller`, atau `admin`
- **Masa aktif**: preset 7 / 30 / 90 / 365 hari, atau **Permanen**, atau isi jumlah hari sendiri

Setelah submit, dialog **tidak langsung tertutup** — muncul kartu hasil berisi:
- Username & password, masing-masing dengan tombol **Salin** (bisa diklik)
- Blok **WEB LOGIN** dengan masa aktif dan sisa hari
- Untuk akun permanen, hanya tertulis "Permanen" tanpa tanggal kedaluwarsa

---

## Buat Akun lewat Bot Telegram

Modul `telegram-bot/createAccount.js` bisa ditempel ke bot Telegram mana pun.
Lihat dokumentasi lengkap di `telegram-bot/README.md`.

```js
const { createAccount, formatAccountMessage } = require("./createAccount");

const result = await createAccount({
  apiBase: "https://domain-kamu.vercel.app",
  adminToken: process.env.VW_ADMIN_TOKEN,
  username: "budi01",
  password: "rahasia123",
  role: "user",   // "user" | "reseller" | "admin"
  days: 30,       // 0 = permanen
});

if (result.ok) {
  await bot.sendMessage(chatId, formatAccountMessage(result.account), { parse_mode: "Markdown" });
}
```

---

## Ubah Password Admin

Cara termudah — panggil endpoint seed untuk mengembalikan ke password default:

```
https://<domain-kamu>.vercel.app/api/seed-admin?secret=vw_seed_2026
```

Atau lewat script (ganti password di dalam file dulu):

```bash
GET https://<domain-kamu>/api/seed-admin?secret=vw_seed_2026
```

Hash yang dipakai: `SHA256(password + "pvincent_salt_2025")`.

---

## Struktur Project

```
artifacts/
  api-server/     → Backend Express API (Supabase)
  dashboard/      → Frontend React + Vite
api/
  index.js        → Entry serverless function untuk Vercel
lib/
  api-spec/       → OpenAPI spec + codegen config
  api-client-react/ → Generated React Query hooks
telegram-bot/
  createAccount.js  → Modul create akun untuk bot Telegram
  bot-example.js    → Contoh bot lengkap
  README.md         → Dokumentasi sistem create via bot
scripts/
  fix-admin-password.mjs → (legacy, MongoDB — tidak dipakai lagi)
```

---

## Branding

- **Nama project**: VINCENT WORLD MULTI
- **Logo**: `BADAK VIN` — gradien warna-warni (violet → indigo → magenta → cyan → emerald)
- **Berkas logo**: `artifacts/dashboard/public/logo.png` (1024×1024), `logo.jpg` (512×512, untuk riwayat/pratinjau tautan), `favicon.svg`
- **Audio**: `artifacts/dashboard/public/audio/ambient.wav` (24 detik, loop)

---

## Kontak

- Dev: @pakvncnt
- Channel: @testipakvncnt
- Tools: PT Vincent
