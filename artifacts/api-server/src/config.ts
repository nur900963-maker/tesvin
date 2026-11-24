// ============================================================
// Config API — semua URL dan endpoint dipusatkan di sini
// Jangan hardcode URL di dalam command/route langsung
// ============================================================

export const API_CONFIG = {
  // Base URL SIPUTZX
  SIPUTZX_BASE: "https://api.siputzx.my.id/api",

  // ── Downloader ──────────────────────────────────────────
  DOWNLOAD: {
    TIKTOK:      "https://api.siputzx.my.id/api/d/tiktok",
    INSTAGRAM:   "https://api.siputzx.my.id/api/d/igdl",
    YOUTUBE:     "https://api.siputzx.my.id/api/d/ytmp4",
    FACEBOOK:    "https://api.siputzx.my.id/api/d/fbdl",
    TWITTER:     "https://api.siputzx.my.id/api/d/twdl",
    SPOTIFY:     "https://api.siputzx.my.id/api/d/spotify",
    CAPCUT:      "https://api.siputzx.my.id/api/d/capcut",
    SOUNDCLOUD:  "https://api.siputzx.my.id/api/d/soundcloud",
    DOUYIN:      "https://api.siputzx.my.id/api/d/douyin",
  },

  // ── Stalker ──────────────────────────────────────────────
  STALK: {
    INSTAGRAM:  "https://api.siputzx.my.id/api/s/instagram",
    TIKTOK:     "https://api.siputzx.my.id/api/s/tiktok",
    THREADS:    "https://api.siputzx.my.id/api/s/threads",
    GITHUB:     "https://api.siputzx.my.id/api/s/github",
    ROBLOX:     "https://api.siputzx.my.id/api/s/roblox",
    PINTEREST:  "https://api.siputzx.my.id/api/s/pinterest",
    TWITTER:    "https://api.siputzx.my.id/api/s/twitter",
    YOUTUBE:    "https://api.siputzx.my.id/api/s/youtube",
  },

  // ── Tools Tambahan ───────────────────────────────────────
  TOOLS: {
    SCREENSHOT:       "https://api.siputzx.my.id/api/tools/screenshot",
    TRANSLATE:        "https://api.siputzx.my.id/api/tools/translate",
    KODE_POS:         "https://api.siputzx.my.id/api/r/kodepos",
    COUNTRY_INFO:     "https://api.siputzx.my.id/api/r/country",
    SUBDOMAIN_FINDER: "https://api.siputzx.my.id/api/tools/subdomainfinder",
    VCC_GENERATOR:    "https://api.siputzx.my.id/api/tools/vcc",
    PINTEREST_SEARCH: "https://api.siputzx.my.id/api/s/pinterest",
    GOOGLE_IMAGE:     "https://api.siputzx.my.id/api/tools/googleimage",
    YOUTUBE_SEARCH:   "https://api.siputzx.my.id/api/s/youtube",
    SOUNDCLOUD_SEARCH:"https://api.siputzx.my.id/api/s/soundcloud",
    KBBI:             "https://api.siputzx.my.id/api/tools/kbbi",
    DDGSEARCH:        "https://api.siputzx.my.id/api/tools/ddgsearch",
    BING_IMAGE:       "https://api.siputzx.my.id/api/tools/bingimage",
    CUACA:            "https://api.siputzx.my.id/api/r/cuaca",
    EVENT_INDONESIA:  "https://api.siputzx.my.id/api/r/eventindonesia",
    JADWAL_TV:        "https://api.siputzx.my.id/api/r/jadwaltv",
    BMKG_GEMPA:       "https://api.siputzx.my.id/api/r/bmkggempa",
    TEXTPRO:          "https://api.siputzx.my.id/api/tools/textpro",
    PHOTOOXY:         "https://api.siputzx.my.id/api/tools/photooxy",
    EPHOTO360:        "https://api.siputzx.my.id/api/tools/ephoto360",
    BRAT:             "https://api.siputzx.my.id/api/tools/brat",
    CHAT_AI:          "https://api.siputzx.my.id/api/ai/chatgpt",
  },

  // ── URL Eksternal Fix ────────────────────────────────────
  URL_FIX_MERAH:    "https://t.me/testipakvncnt",
  URL_GACHA_NOKOS:  "https://nokos.id/gacha",
  URL_NOKOS:        "https://nokos.id",
  URL_PT_VINCENT:   "https://ptvincent.web.id",
  URL_WEB_BLAST:    "https://t.me/testipakvncnt",
  URL_VJ_CENT:      "https://vjcent.id",
  URL_FAKE_DANA:    "https://fakedana.vercel.app",
} as const;
