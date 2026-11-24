/**
 * ============================================================
 * VINCENT WORLD MULTI — Modul Create Akun untuk Bot Telegram
 * ============================================================
 *
 * Berkas ini berdiri sendiri (tidak mengimpor apa pun dari dashboard)
 * sehingga bisa ditempel ke bot Telegram mana pun.
 *
 * Yang dibutuhkan hanya:
 *   - Node.js 18+ (fetch bawaan)
 *   - URL API VINCENT WORLD MULTI yang sudah di-deploy
 *   - Token admin (JWT) dari login admin
 *
 * Cara pakai singkat:
 *
 *   const { createAccount, formatAccountMessage } = require("./createAccount");
 *
 *   const result = await createAccount({
 *     apiBase: "https://domain-kamu.vercel.app",
 *     adminToken: process.env.VW_ADMIN_TOKEN,
 *     username: "budi01",
 *     password: "rahasia123",
 *     role: "user",          // "user" | "reseller" | "admin"
 *     days: 30,              // 0 = permanen
 *     note: "reseller Bandung",
 *   });
 *
 *   if (result.ok) {
 *     await bot.sendMessage(chatId, formatAccountMessage(result.account), { parse_mode: "Markdown" });
 *   } else {
 *     await bot.sendMessage(chatId, `❌ ${result.error}`);
 *   }
 *
 * Dokumentasi lengkap: telegram-bot/README.md
 * ============================================================
 */

"use strict";

const ROLES = ["user", "reseller", "admin"];

const ROLE_LABEL = {
  user: "User",
  reseller: "Reseller",
  admin: "Admin",
};

/**
 * Hitung tanggal kedaluwarsa dari jumlah hari.
 * @param {number} days 0 atau negatif = permanen
 * @returns {string|null} ISO string, atau null untuk permanen
 */
function computeExpiredAt(days) {
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/**
 * Validasi input sebelum memanggil API.
 * @returns {{ok: true} | {ok: false, error: string}}
 */
function validate({ username, password, role }) {
  if (!username || typeof username !== "string" || !username.trim()) {
    return { ok: false, error: "Username wajib diisi." };
  }
  if (username.trim().length < 3) {
    return { ok: false, error: "Username minimal 3 karakter." };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
    return { ok: false, error: "Username hanya boleh huruf, angka, titik, garis bawah, dan strip." };
  }
  if (!password || typeof password !== "string") {
    return { ok: false, error: "Password wajib diisi." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password minimal 6 karakter." };
  }
  if (role && !ROLES.includes(role)) {
    return { ok: false, error: `Role harus salah satu dari: ${ROLES.join(", ")}` };
  }
  return { ok: true };
}

/**
 * Buat akun lewat API VINCENT WORLD MULTI.
 *
 * @param {object} opts
 * @param {string} opts.apiBase      URL dashboard, tanpa garis miring di akhir
 * @param {string} opts.adminToken   JWT admin (dari /api/auth/login)
 * @param {string} opts.username
 * @param {string} opts.password
 * @param {"user"|"reseller"|"admin"} [opts.role="user"]
 * @param {number} [opts.days=30]    0 = permanen
 * @param {string} [opts.note]
 * @param {number} [opts.timeoutMs=15000]
 *
 * @returns {Promise<{ok: true, account: object} | {ok: false, error: string, code?: string}>}
 */
async function createAccount(opts) {
  const {
    apiBase,
    adminToken,
    username,
    password,
    role = "user",
    days = 30,
    note,
    timeoutMs = 15000,
  } = opts || {};

  if (!apiBase) return { ok: false, error: "apiBase belum diisi.", code: "NO_API_BASE" };
  if (!adminToken) return { ok: false, error: "adminToken belum diisi.", code: "NO_TOKEN" };

  const v = validate({ username, password, role });
  if (!v.ok) return { ok: false, error: v.error, code: "VALIDATION" };

  const expiredAt = computeExpiredAt(days);
  const url = `${apiBase.replace(/\/+$/, "")}/api/users`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
        role,
        expiredAt: expiredAt ?? undefined,
        note: note ? String(note).trim() : undefined,
      }),
    });

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    if (res.status === 401) {
      return { ok: false, error: "Token admin tidak valid atau sudah kedaluwarsa.", code: "UNAUTHORIZED" };
    }
    if (res.status === 403) {
      return { ok: false, error: "Akun ini bukan admin, tidak boleh membuat user.", code: "FORBIDDEN" };
    }
    if (res.status === 400) {
      const msg = body?.error || "Data ditolak server.";
      if (/already exists/i.test(msg)) {
        return { ok: false, error: `Username "${username.trim()}" sudah dipakai.`, code: "DUPLICATE" };
      }
      return { ok: false, error: msg, code: "BAD_REQUEST" };
    }
    if (!res.ok) {
      return { ok: false, error: body?.error || `Server membalas HTTP ${res.status}.`, code: "HTTP_" + res.status };
    }

    return {
      ok: true,
      account: {
        id: body?.id ?? null,
        username: body?.username ?? username.trim(),
        password, // API tidak mengembalikan password; kita teruskan yang dipakai
        role: body?.role ?? role,
        status: body?.status ?? "active",
        expiredAt: body?.expiredAt ?? expiredAt,
        note: body?.note ?? (note ?? null),
        createdAt: body?.createdAt ?? new Date().toISOString(),
      },
    };
  } catch (e) {
    if (e && e.name === "AbortError") {
      return { ok: false, error: "Server tidak merespons (timeout).", code: "TIMEOUT" };
    }
    return { ok: false, error: `Gagal menghubungi server: ${e?.message ?? "unknown"}`, code: "NETWORK" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Format pesan Telegram (Markdown) untuk akun yang baru dibuat.
 * @param {object} account hasil dari createAccount().account
 * @returns {string}
 */
function formatAccountMessage(account) {
  const permanent = !account.expiredAt;
  const expiredLabel = permanent
    ? "Permanen"
    : new Date(account.expiredAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const daysLeft = permanent
    ? null
    : Math.max(0, Math.ceil((new Date(account.expiredAt).getTime() - Date.now()) / 86400000));

  const lines = [
    "✅ *AKUN BERHASIL DIBUAT*",
    "",
    `👤 *Username* : \`${account.username}\``,
    `🔑 *Password* : \`${account.password}\``,
    `🏷 *Role* : ${ROLE_LABEL[account.role] ?? account.role}`,
    "",
    "🌐 *WEB LOGIN*",
    `📅 Masa aktif : ${expiredLabel}`,
  ];

  if (!permanent) {
    lines.push(`⏳ Sisa : ${daysLeft} hari`);
  }

  if (account.note) {
    lines.push("", `📝 Catatan : ${account.note}`);
  }

  lines.push("", "_Ketuk username atau password untuk menyalin._");

  return lines.join("\n");
}

/**
 * Format pesan daftar akun (untuk perintah /listuser).
 * @param {Array<object>} users
 * @returns {string}
 */
function formatUserList(users) {
  if (!Array.isArray(users) || users.length === 0) {
    return "📭 Belum ada akun terdaftar.";
  }
  const lines = [`📋 *DAFTAR AKUN* (${users.length})`, ""];
  users.slice(0, 40).forEach((u, i) => {
    const permanent = !u.expiredAt;
    const exp = permanent
      ? "∞"
      : new Date(u.expiredAt).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
    lines.push(`${i + 1}. \`${u.username}\` — ${ROLE_LABEL[u.role] ?? u.role} — ${u.status} — ${exp}`);
  });
  if (users.length > 40) lines.push("", `_…dan ${users.length - 40} akun lainnya._`);
  return lines.join("\n");
}

module.exports = {
  createAccount,
  formatAccountMessage,
  formatUserList,
  computeExpiredAt,
  validate,
  ROLES,
  ROLE_LABEL,
};
