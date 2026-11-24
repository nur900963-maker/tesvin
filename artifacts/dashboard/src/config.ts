// ── Audio ────────────────────────────────────────────────────
// Isi VITE_AUDIO_URL (Vercel → Environment Variables, atau .env.local) dengan
// link audio langsung (.mp3/.wav/.ogg, harus https://). Kosong = pakai file
// bawaan /audio/ambient.wav.
// CATATAN: variabel VITE_* ikut ter-bundle ke browser, jadi URL audio ini
// BUKAN rahasia (siapa pun bisa lihat lewat DevTools). Itu memang sifat audio
// di sisi klien. Jangan taruh token/credential di dalamnya.
const DEFAULT_AUDIO = "/audio/ambient.wav";
const RAW_AUDIO = String(import.meta.env.VITE_AUDIO_URL ?? "").trim();
const CUSTOM_AUDIO = /^https:\/\//i.test(RAW_AUDIO) || RAW_AUDIO.startsWith("/") ? RAW_AUDIO : "";
let AUDIO_HOST = "";
try { AUDIO_HOST = CUSTOM_AUDIO.startsWith("http") ? new URL(CUSTOM_AUDIO).host : ""; } catch { AUDIO_HOST = ""; }

export const CONFIG = {
  APP_NAME: "VINCENT WORLD MULTI",
  APP_SUBTITLE: "VINCENT WORLD MULTI DASHBOARD",
  APP_VERSION: "6.0.0",
  APP_UPDATED: "24 Nov 2026",

  // Branding
  BRAND: "BADAK VIN",
  LOGO: "/logo.png",
  LOGO_JPG: "/logo.jpg",
  AUDIO_SRC: CUSTOM_AUDIO || DEFAULT_AUDIO,
  AUDIO_LABEL: CUSTOM_AUDIO ? `Audio — ${AUDIO_HOST || CUSTOM_AUDIO}` : "Ambient Pad — public/audio/ambient.wav",
  AUDIO_DISPLAY: CUSTOM_AUDIO ? (AUDIO_HOST || CUSTOM_AUDIO) : DEFAULT_AUDIO,
  TIMEZONE: "Asia/Jakarta",
  TZ_LABEL: "WIB",

  // URL Eksternal
  URL_PT_VINCENT:  "https://ptvincent.web.id",
  URL_NOKOS:       "https://nokos.id",
  URL_FAKE_DANA:   "https://fakedana.vercel.app",
  URL_VJ_CENT:     "https://vjcent.id",
  URL_WEB_BLAST:   "https://t.me/testipakvncnt",
  URL_FIX_MERAH:   "https://t.me/testipakvncnt",
  URL_GACHA_NOKOS: "https://nokos.id/gacha",

  DEV: "@pakvncnt",
  CHANNEL: "@testipakvncnt",
  TOOLS_NAME: "Vincent World Multi",
} as const;
