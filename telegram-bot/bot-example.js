/**
 * ============================================================
 * VINCENT WORLD MULTI — Contoh Bot Telegram (long polling)
 * ============================================================
 *
 * Jalankan:
 *   export VW_API_BASE="https://DOMAIN-KAMU"
 *   export VW_ADMIN_TOKEN="eyJhbGciOi..."
 *   export TELEGRAM_BOT_TOKEN="123456:ABC..."
 *   export TELEGRAM_ADMIN_IDS="123456789"   # opsional tapi disarankan
 *   node bot-example.js
 *
 * Tanpa dependensi eksternal — memakai fetch bawaan Node 18+.
 * ============================================================
 */

"use strict";

const { createAccount, formatAccountMessage, formatUserList } = require("./createAccount");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = process.env.VW_API_BASE;
const ADMIN_TOKEN = process.env.VW_ADMIN_TOKEN;
const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN belum diisi.");
  process.exit(1);
}
if (!API_BASE || !ADMIN_TOKEN) {
  console.error("❌ VW_API_BASE dan VW_ADMIN_TOKEN wajib diisi.");
  process.exit(1);
}

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Sesi tanya-jawab bertahap per chat
const sessions = new Map();

async function tg(method, payload) {
  const res = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const send = (chatId, text, extra = {}) =>
  tg("sendMessage", { chat_id: chatId, text, parse_mode: "Markdown", ...extra });

function isAllowed(userId) {
  if (ADMIN_IDS.length === 0) return true; // belum dibatasi
  return ADMIN_IDS.includes(String(userId));
}

const HELP = [
  "🤖 *VINCENT WORLD MULTI — Bot Create Akun*",
  "",
  "*Perintah:*",
  "`/buat <user> <pass> [role] [hari]` — buat akun",
  "`/buat` — mode tanya-jawab",
  "`/listuser` — daftar akun",
  "`/batal` — batalkan proses",
  "",
  "*Contoh:*",
  "`/buat budi01 rahasia123`",
  "`/buat reseller01 rahasia123 reseller 90`",
  "`/buat admin02 rahasia123 admin 0`",
  "",
  "_role: user / reseller / admin · hari: 0 = permanen_",
].join("\n");

async function handleBuat(chatId, args) {
  if (args.length === 0) {
    sessions.set(chatId, { step: "username", data: {} });
    return send(chatId, "📝 *Buat akun baru*\n\nMasukkan *username*:\n_(ketik /batal untuk membatalkan)_");
  }

  const [username, password, role = "user", days = "30"] = args;

  if (!password) {
    return send(chatId, "❌ Format: `/buat <username> <password> [role] [hari]`");
  }

  await send(chatId, "⏳ Membuat akun...");

  const result = await createAccount({
    apiBase: API_BASE,
    adminToken: ADMIN_TOKEN,
    username,
    password,
    role,
    days: Number(days),
  });

  if (result.ok) {
    return send(chatId, formatAccountMessage(result.account));
  }
  return send(chatId, `❌ *Gagal membuat akun*\n\n${result.error}\n\n\`${result.code ?? "-"}\``);
}

async function handleSession(chatId, text) {
  const s = sessions.get(chatId);
  if (!s) return false;

  if (s.step === "username") {
    s.data.username = text.trim();
    s.step = "password";
    sessions.set(chatId, s);
    await send(chatId, "🔑 Masukkan *password* (minimal 6 karakter):");
    return true;
  }

  if (s.step === "password") {
    s.data.password = text.trim();
    s.step = "role";
    sessions.set(chatId, s);
    await send(chatId, "🏷 Pilih *role*:\n\n`user` · `reseller` · `admin`");
    return true;
  }

  if (s.step === "role") {
    const role = text.trim().toLowerCase();
    if (!["user", "reseller", "admin"].includes(role)) {
      await send(chatId, "❌ Role harus `user`, `reseller`, atau `admin`.");
      return true;
    }
    s.data.role = role;
    s.step = "days";
    sessions.set(chatId, s);
    await send(chatId, "📅 Masa aktif dalam *hari* (ketik `0` untuk permanen):");
    return true;
  }

  if (s.step === "days") {
    const days = Number(text.trim());
    if (!Number.isFinite(days) || days < 0) {
      await send(chatId, "❌ Masukkan angka. Contoh: `30` atau `0` untuk permanen.");
      return true;
    }
    sessions.delete(chatId);

    await send(chatId, "⏳ Membuat akun...");
    const result = await createAccount({
      apiBase: API_BASE,
      adminToken: ADMIN_TOKEN,
      username: s.data.username,
      password: s.data.password,
      role: s.data.role,
      days,
    });

    if (result.ok) {
      await send(chatId, formatAccountMessage(result.account));
    } else {
      await send(chatId, `❌ *Gagal membuat akun*\n\n${result.error}\n\n\`${result.code ?? "-"}\``);
    }
    return true;
  }

  return false;
}

async function handleListUser(chatId) {
  try {
    const res = await fetch(`${API_BASE.replace(/\/+$/, "")}/api/users`, {
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    if (res.status === 401) {
      return send(chatId, "❌ Token admin tidak valid atau kedaluwarsa.");
    }
    if (!res.ok) {
      return send(chatId, `❌ Server membalas HTTP ${res.status}.`);
    }
    const users = await res.json();
    return send(chatId, formatUserList(users));
  } catch (e) {
    return send(chatId, `❌ Gagal menghubungi server: ${e?.message ?? "unknown"}`);
  }
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text.trim();

  if (!isAllowed(userId)) {
    return send(chatId, "🚫 Kamu tidak punya izin memakai bot ini.");
  }

  if (text === "/start" || text === "/help") {
    sessions.delete(chatId);
    return send(chatId, HELP);
  }

  if (text === "/batal") {
    sessions.delete(chatId);
    return send(chatId, "✅ Dibatalkan.");
  }

  if (text.startsWith("/buat")) {
    const args = text.split(/\s+/).slice(1);
    return handleBuat(chatId, args);
  }

  if (text === "/listuser") {
    return handleListUser(chatId);
  }

  // Lanjutan sesi tanya-jawab
  const handled = await handleSession(chatId, text);
  if (handled) return;

  return send(chatId, "❓ Perintah tidak dikenal. Ketik /start untuk bantuan.");
}

// ── Long polling ────────────────────────────────────────────
let offset = 0;

async function poll() {
  try {
    const res = await fetch(`${TG}/getUpdates?timeout=30&offset=${offset}`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        try {
          await handleUpdate(update);
        } catch (e) {
          console.error("Error menangani update:", e);
        }
      }
    }
  } catch (e) {
    console.error("Polling error:", e?.message ?? e);
    await new Promise((r) => setTimeout(r, 3000));
  }
  setImmediate(poll);
}

console.log("🤖 Bot VINCENT WORLD MULTI berjalan...");
console.log(`   API  : ${API_BASE}`);
console.log(`   Batas: ${ADMIN_IDS.length ? ADMIN_IDS.join(", ") : "SEMUA ORANG (sebaiknya dibatasi!)"}`);
poll();
