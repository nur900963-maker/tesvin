# Sistem Create Akun via Bot Telegram

Modul ini memungkinkan bot Telegram kamu membuat akun **VINCENT WORLD MULTI**
(user / reseller / admin) langsung dari chat, tanpa membuka dashboard.

Semua pembuatan akun tetap lewat API dashboard, jadi aturan validasi,
penyimpanan, dan log-nya sama persis dengan yang di web.

---

## 1. Isi folder

| Berkas | Fungsi |
|---|---|
| `createAccount.js` | Modul inti — panggil API, validasi, format pesan. Tanpa dependensi. |
| `bot-example.js` | Contoh bot lengkap (long-polling) siap dijalankan. |
| `README.md` | Dokumen ini. |

`createAccount.js` **tidak mengimpor apa pun** dari dashboard, jadi bisa
ditempel ke bot mana pun (telegraf, grammY, node-telegram-bot-api, atau
bahkan bot WhatsApp).

---

## 2. Yang perlu disiapkan

1. **Dashboard sudah di-deploy** — misal `https://vincent-world.vercel.app`
2. **Token admin (JWT)** — ambil dari login admin:

```bash
curl -X POST https://DOMAIN-KAMU/api/auth/login \
  -H "content-type: application/json" \
  -d '{"username":"admin","password":"PASSWORD_ADMIN"}'
```

Respons berisi `token`. Simpan sebagai environment variable:

```bash
export VW_API_BASE="https://DOMAIN-KAMU"
export VW_ADMIN_TOKEN="eyJhbGciOi..."
export TELEGRAM_BOT_TOKEN="123456:ABC..."
```

> **Catatan masa berlaku token.** Token JWT punya masa berlaku. Kalau bot
> dipakai jangka panjang, simpan kredensial admin di environment dan
> login ulang otomatis saat API membalas `401` (lihat bagian 5).

---

## 3. Pakai modulnya

```js
const { createAccount, formatAccountMessage } = require("./createAccount");

const result = await createAccount({
  apiBase: process.env.VW_API_BASE,
  adminToken: process.env.VW_ADMIN_TOKEN,
  username: "budi01",
  password: "rahasia123",
  role: "user",     // "user" | "reseller" | "admin"
  days: 30,         // 0 = permanen
  note: "reseller Bandung",
});

if (result.ok) {
  console.log(formatAccountMessage(result.account));
} else {
  console.error(result.error, result.code);
}
```

### Parameter `createAccount`

| Nama | Tipe | Wajib | Default | Keterangan |
|---|---|---|---|---|
| `apiBase` | string | ✅ | — | URL dashboard, tanpa `/` di akhir |
| `adminToken` | string | ✅ | — | JWT admin |
| `username` | string | ✅ | — | 3+ karakter, `a-z A-Z 0-9 . _ -` |
| `password` | string | ✅ | — | Minimal 6 karakter |
| `role` | string | — | `"user"` | `user` / `reseller` / `admin` |
| `days` | number | — | `30` | Masa aktif. `0` = permanen |
| `note` | string | — | — | Catatan bebas |
| `timeoutMs` | number | — | `15000` | Batas tunggu |

### Nilai balikan

```js
// Berhasil
{ ok: true, account: { id, username, password, role, status, expiredAt, note, createdAt } }

// Gagal
{ ok: false, error: "Username \"budi01\" sudah dipakai.", code: "DUPLICATE" }
```

### Kode error

| `code` | Arti | Yang harus dilakukan |
|---|---|---|
| `VALIDATION` | Input tidak lolos validasi lokal | Perbaiki input |
| `NO_API_BASE` / `NO_TOKEN` | Konfigurasi belum diisi | Isi environment |
| `UNAUTHORIZED` | Token admin tidak valid / kedaluwarsa | Login ulang, perbarui token |
| `FORBIDDEN` | Akun bukan admin | Pakai akun admin |
| `DUPLICATE` | Username sudah dipakai | Ganti username |
| `BAD_REQUEST` | Server menolak data | Lihat `error` |
| `TIMEOUT` | Server tidak merespons | Coba lagi |
| `NETWORK` | Gagal menghubungi server | Cek `apiBase` & jaringan |

---

## 4. Menjalankan contoh bot

```bash
cd telegram-bot
export VW_API_BASE="https://DOMAIN-KAMU"
export VW_ADMIN_TOKEN="eyJhbGciOi..."
export TELEGRAM_BOT_TOKEN="123456:ABC..."
node bot-example.js
```

### Perintah yang tersedia

| Perintah | Fungsi |
|---|---|
| `/start` | Menu bantuan |
| `/buat <user> <pass> [role] [hari]` | Buat akun |
| `/buat` (tanpa argumen) | Mode tanya-jawab bertahap |
| `/listuser` | Daftar akun (maks. 40) |
| `/batal` | Batalkan proses yang sedang berjalan |

Contoh:

```
/buat budi01 rahasia123
/buat reseller01 rahasia123 reseller 90
/buat admin02 rahasia123 admin 0
```

---

## 5. Login ulang otomatis (opsional)

Kalau token kedaluwarsa, bot bisa login sendiri:

```js
let cachedToken = process.env.VW_ADMIN_TOKEN;

async function getToken() {
  if (cachedToken) return cachedToken;
  const res = await fetch(`${process.env.VW_API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: process.env.VW_ADMIN_USER,
      password: process.env.VW_ADMIN_PASS,
    }),
  });
  const data = await res.json();
  cachedToken = data.token;
  return cachedToken;
}

// Saat createAccount membalas UNAUTHORIZED:
//   cachedToken = null;  lalu ulangi sekali
```

---

## 6. Batasi siapa yang boleh membuat akun

**Penting.** Bot Telegram bisa dihubungi siapa saja yang tahu namanya.
Selalu batasi dengan daftar ID:

```js
const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(s => s.trim());

function isAllowed(userId) {
  return ADMIN_IDS.includes(String(userId));
}
```

Dapatkan ID Telegram kamu dari [@userinfobot](https://t.me/userinfobot).

---

## 7. Format pesan hasil

`formatAccountMessage()` menghasilkan pesan Markdown seperti ini:

```
✅ AKUN BERHASIL DIBUAT

👤 Username : `budi01`
🔑 Password : `rahasia123`
🏷 Role : User

🌐 WEB LOGIN
📅 Masa aktif : 24 Desember 2026
⏳ Sisa : 30 hari

📝 Catatan : reseller Bandung

_Ketuk username atau password untuk menyalin._
```

Di Telegram, teks di dalam backtick bisa diketuk untuk disalin.

---

## 8. Catatan keamanan

- **Jangan** menaruh token admin di dalam kode. Selalu environment variable.
- Password yang dikirim lewat chat Telegram **terlihat di riwayat chat**. Untuk
  akun penting, minta pengguna menggantinya setelah login pertama.
- Modul ini tidak menyimpan password di mana pun; ia hanya meneruskannya ke API
  dan mengembalikannya untuk ditampilkan sekali.
- Aktifkan pembatasan ID (bagian 6) sebelum bot dipakai publik.
