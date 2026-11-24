import { Router } from "express";
import { insertLog, insertToolUsage } from "../lib/db";
import { verifyToken } from "./auth";
import https from "https";
import http from "http";
import { API_CONFIG } from "../config";

const router = Router();

function requireAuth(req: any, res: any): { userId: string; username: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: "Invalid token" }); return null; }
  return decoded;
}

async function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function logToolUsage(userId: string, username: string, toolId: string, toolName: string) {
  await insertToolUsage(userId, toolId, toolName);
  await insertLog({ userId, username, action: "USE_TOOL", detail: `Used tool: ${toolName}` });
}

const TOOLS_LIST = [
  { id: "ngl-spam", name: "NGL Spammer", description: "Anonymous Message", category: "social", isReal: false, icon: "instagram" },
  { id: "fake-dana", name: "Fake DANA", description: "Generate Saldo", category: "finance", isReal: false, icon: "wallet" },
  { id: "fix-merah", name: "Fix Merah", description: "Tutorial Fix Red", category: "whatsapp", isReal: false, icon: "bug" },
  { id: "web-blast", name: "Web Blast", description: "Kumpulan Link", category: "tools", isReal: false, icon: "globe" },
  { id: "pt-hasnan", name: "PT Hasnan", description: "Benefit & Join", category: "info", isReal: false, icon: "building" },
  { id: "meta-bisnis", name: "Meta Bisnis", description: "Verifikasi WA Bisnis", category: "whatsapp", isReal: false, icon: "facebook" },
  { id: "nik-check", name: "NIK Check", description: "Cek Data KTP", category: "info", isReal: false, icon: "id-card" },
  { id: "phone-lookup", name: "Phone Lookup", description: "Cek Nomor Telepon", category: "info", isReal: true, icon: "phone" },
  { id: "buy-nokos", name: "Buy Nokos", description: "Beli Nokos", category: "shop", isReal: false, icon: "shopping-cart" },
  { id: "gacha-nokos", name: "Gacha Nokos", description: "Gacha Nokos", category: "shop", isReal: false, icon: "gift" },
  { id: "uncheck-jasteb", name: "Uncheck/Jasteb", description: "Panel Uncheck", category: "whatsapp", isReal: false, icon: "check-circle" },
  { id: "chat-ai", name: "Chat AI", description: "AI Meta Assistant", category: "ai", isReal: true, icon: "bot" },
  { id: "download-video", name: "Download Video", description: "Download Sosmed", category: "download", isReal: true, icon: "download" },
  { id: "ig-stalk", name: "IG Stalk", description: "Info Akun Instagram", category: "social", isReal: true, icon: "instagram" },
];

router.get("/tools", async (req, res) => {
  res.json(TOOLS_LIST);
});

router.post("/tools/download", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  if (!url) { res.status(400).json({ error: "URL required" }); return; }
  await logToolUsage(actor.userId, actor.username, "download-video", "Download Video");
  let platform = "unknown";
  try {
    if (url.includes("tiktok.com") || url.includes("douyin.com")) {
      platform = url.includes("douyin.com") ? "douyin" : "tiktok";
      const d = await fetchJsonHttp(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
      if (d?.code === 0 && d?.data) {
        const v = d.data;
        res.json({ success: true, title: v.title || "TikTok Video", thumbnail: v.cover || null,
          downloadUrl: v.hdplay || v.play || null, audioUrl: v.music_info?.play || null, quality: "HD", platform, error: null });
        return;
      }
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      platform = "youtube";
      const vidMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const vidId = vidMatch?.[1];
      if (vidId) {
        res.json({ success: true, title: `YouTube Video (${vidId})`,
          thumbnail: `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`,
          downloadUrl: `https://invidious.jing.rocks/latest_version?id=${vidId}&itag=22`,
          quality: "720p", platform, error: null });
        return;
      }
    }
    if (url.includes("instagram.com")) { platform="instagram"; res.json({ success:false, title:null, thumbnail:null, downloadUrl:null, quality:null, platform, error:"Instagram: paste URL di saveinsta.app untuk download gratis" }); return; }
    if (url.includes("twitter.com") || url.includes("x.com")) { platform="twitter"; res.json({ success:false, title:null, thumbnail:null, downloadUrl:null, quality:null, platform, error:"Twitter/X: gunakan ssnaptik.app atau twittervideodownloader.com" }); return; }
    if (url.includes("facebook.com") || url.includes("fb.watch")) { platform="facebook"; res.json({ success:false, title:null, thumbnail:null, downloadUrl:null, quality:null, platform, error:"Facebook: gunakan fdown.net atau fbdown.net" }); return; }
    res.json({ success:false, title:null, thumbnail:null, downloadUrl:null, quality:null, platform, error:"Platform tidak didukung. Gunakan URL TikTok, YouTube, Instagram, Twitter, atau Facebook." });
  } catch(err) {
    res.json({ success:false, title:null, thumbnail:null, downloadUrl:null, quality:null, platform, error:"Download gagal" });
  }
});
router.post("/tools/ig-stalk", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }

  try {
    await logToolUsage(actor.userId, actor.username, "ig-stalk", "IG Stalk");

    try {
      const data = await fetchJson(`${API_CONFIG.STALK.INSTAGRAM}?username=${encodeURIComponent(username.replace("@", ""))}`);
      if (data?.status && data?.data) {
        const d = data.data;
        res.json({
          success: true,
          username: d.username || username,
          fullName: d.full_name || null,
          bio: d.biography || null,
          followers: d.edge_followed_by?.count ?? d.followers ?? null,
          following: d.edge_follow?.count ?? d.following ?? null,
          posts: d.edge_owner_to_timeline_media?.count ?? d.posts ?? null,
          isPrivate: d.is_private ?? null,
          profilePic: d.profile_pic_url_hd || d.profile_pic_url || null,
          error: null,
        });
        return;
      }
    } catch {}

    res.json({ success: false, username: null, fullName: null, bio: null, followers: null, following: null, posts: null, isPrivate: null, profilePic: null, error: "Akun tidak ditemukan" });
  } catch {
    res.json({ success: false, username: null, fullName: null, bio: null, followers: null, following: null, posts: null, isPrivate: null, profilePic: null, error: "Gagal" });
  }
});

router.post("/tools/phone-lookup", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { phone } = req.body as { phone: string };
  if (!phone) { res.status(400).json({ error: "Phone required" }); return; }

  await logToolUsage(actor.userId, actor.username, "phone-lookup", "Phone Lookup");

  const clean = phone.replace(/\D/g, "");
  let operator = "Unknown";
  let region = "Indonesia";

  const prefixes: Record<string, string> = {
    "0811": "Telkomsel", "0812": "Telkomsel", "0813": "Telkomsel", "0821": "Telkomsel",
    "0822": "Telkomsel", "0823": "Telkomsel", "0851": "Telkomsel", "0852": "Telkomsel",
    "0853": "Telkomsel", "0814": "Indosat", "0815": "Indosat", "0816": "Indosat",
    "0855": "Indosat", "0856": "Indosat", "0857": "Indosat", "0858": "Indosat",
    "0817": "XL Axiata", "0818": "XL Axiata", "0819": "XL Axiata", "0859": "XL Axiata",
    "0877": "XL Axiata", "0878": "XL Axiata", "0831": "Axis", "0832": "Axis",
    "0833": "Axis", "0838": "Axis", "0881": "Smartfren", "0882": "Smartfren",
    "0883": "Smartfren", "0884": "Smartfren", "0885": "Smartfren", "0886": "Smartfren",
    "0887": "Smartfren", "0888": "Smartfren", "0889": "Smartfren",
  };

  const localNum = clean.startsWith("62") ? "0" + clean.slice(2) : clean;
  for (const prefix of Object.keys(prefixes)) {
    if (localNum.startsWith(prefix)) { operator = prefixes[prefix]; break; }
  }

  res.json({
    success: true,
    phone: clean,
    operator,
    region,
    isValid: clean.length >= 10 && clean.length <= 15,
    error: null,
  });
});

router.post("/tools/ngl-spam", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { count } = req.body as { targetUrl: string; message: string; count: number };
  await logToolUsage(actor.userId, actor.username, "ngl-spam", "NGL Spammer");

  const sent = Math.min(count || 10, 100);
  await new Promise(r => setTimeout(r, 800));

  res.json({
    success: true,
    message: `Berhasil mengirim ${sent} pesan anonim ke target!`,
    data: { sent, failed: 0, status: "completed" },
  });
});

router.post("/tools/fake-dana", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { name, amount } = req.body as { name: string; amount: string };
  await logToolUsage(actor.userId, actor.username, "fake-dana", "Fake DANA");

  res.json({
    success: true,
    message: `Struk DANA berhasil dibuat untuk ${name} dengan saldo Rp ${amount}`,
    data: {
      name,
      amount,
      transactionId: `TXN${Date.now()}`,
      date: new Date().toLocaleDateString("id-ID"),
      status: "BERHASIL",
    },
  });
});

router.post("/tools/whatsapp-badak", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { targetNumber, method } = req.body as { targetNumber: string; method: string };
  await logToolUsage(actor.userId, actor.username, "whatsapp-badak", "WhatsApp Badak");

  await new Promise(r => setTimeout(r, 1200));

  res.json({
    success: true,
    message: `Badak berhasil dikirim ke ${targetNumber} menggunakan ${method}!`,
    data: {
      target: targetNumber,
      method,
      status: "SENT",
      timestamp: new Date().toISOString(),
    },
  });
});

router.post("/tools/nik-check", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { nik } = req.body as { nik: string };
  await logToolUsage(actor.userId, actor.username, "nik-check", "NIK Check");

  if (!nik || nik.length !== 16) {
    res.json({ success: false, message: "NIK harus 16 digit", data: null });
    return;
  }

  const provinces: Record<string, string> = {
    "11": "Aceh", "12": "Sumatera Utara", "13": "Sumatera Barat",
    "31": "DKI Jakarta", "32": "Jawa Barat", "33": "Jawa Tengah",
    "34": "DI Yogyakarta", "35": "Jawa Timur", "36": "Banten",
    "51": "Bali", "52": "Nusa Tenggara Barat", "61": "Kalimantan Barat",
    "71": "Sulawesi Utara", "73": "Sulawesi Selatan",
  };

  const prov = provinces[nik.slice(0, 2)] || "Indonesia";
  const dayCode = parseInt(nik.slice(6, 8));
  const gender = dayCode > 40 ? "Perempuan" : "Laki-laki";
  const actualDay = dayCode > 40 ? dayCode - 40 : dayCode;
  const month = parseInt(nik.slice(8, 10));
  const year = parseInt(nik.slice(10, 12));
  const fullYear = year < 30 ? 2000 + year : 1900 + year;

  const names = ["Budi Santoso", "Dewi Rahayu", "Ahmad Fauzi", "Siti Nurhaliza", "Rizky Pratama"];
  const randomName = names[parseInt(nik.slice(12, 14)) % names.length];

  res.json({
    success: true,
    message: "Data KTP berhasil ditemukan",
    data: {
      nik,
      nama: gender === "Perempuan" ? "Dewi " + randomName.split(" ")[1] : randomName,
      gender,
      tanggalLahir: `${actualDay.toString().padStart(2, "0")}-${month.toString().padStart(2, "0")}-${fullYear}`,
      provinsi: prov,
      status: "VALID",
    },
  });
});

router.post("/tools/chat-ai", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { message } = req.body as { message: string };
  if (!message) { res.status(400).json({ error: "Message required" }); return; }

  await logToolUsage(actor.userId, actor.username, "chat-ai", "Chat AI");

  try {
    const data = await fetchJson(`${API_CONFIG.TOOLS.CHAT_AI}?prompt=${encodeURIComponent(message)}`);
    if (data?.status && data?.data) {
      res.json({ success: true, message: data.data, data: null });
      return;
    }
  } catch {}

  const responses = [
    "Halo! Saya AI Assistant PT Vincent. Ada yang bisa saya bantu?",
    "Pertanyaan yang menarik! Izinkan saya membantu Anda.",
    "Terima kasih sudah menggunakan layanan AI kami.",
    "Saya akan mencoba membantu dengan sebaik mungkin.",
  ];
  res.json({ success: true, message: responses[Math.floor(Math.random() * responses.length)], data: null });
});

// ── HELPER: node https/http based fetch (works on all Node versions) ──
function fetchHttp(url: string, opts: { method?: string; headers?: Record<string,string>; body?: string; timeout?: number } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const reqOpts = {
      hostname: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search, method: opts.method || "GET",
      headers: { "User-Agent": "Mozilla/5.0 VincentWorld/1.0", "Accept": "application/json,*/*", ...(opts.headers||{}) },
    };
    if (opts.body && reqOpts.headers) (reqOpts.headers as any)["Content-Length"] = Buffer.byteLength(opts.body).toString();
    const req = lib.request(reqOpts, (res) => {
      let data = "";
      res.on("data", (chunk: any) => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(opts.timeout ?? 12000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}
async function fetchJsonHttp(url: string, opts: { headers?: Record<string,string>; timeout?: number } = {}): Promise<any> {
  const text = await fetchHttp(url, opts);
  try { return JSON.parse(text); } catch { throw new Error("Invalid JSON: " + text.slice(0, 100)); }
}
async function fetchTextHttp(url: string, opts: { headers?: Record<string,string>; timeout?: number } = {}): Promise<string> {
  return fetchHttp(url, opts);
}

// ── Stalker TikTok ────────────────────────────────────────
router.post("/tools/stalk-tiktok", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-tiktok", "Stalk TikTok");
  try {
    const u = username.replace("@","");
    const d = await fetchJsonHttp(`https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(u)}`);
    if (d?.code === 0 && d?.data?.user) {
      const u2 = d.data.user;
      res.json({ success:true, data:{ username:u2.unique_id, fullName:u2.nickname, bio:u2.signature,
        followers:u2.follower_count, following:u2.following_count, likes:u2.total_favorited,
        videos:u2.video_count, avatar:u2.avatar_larger, verified:!!u2.verified }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Akun TikTok tidak ditemukan atau API sedang sibuk" });
});

// ── Stalker Threads ───────────────────────────────────────
router.post("/tools/stalk-threads", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-threads", "Stalk Threads");
  res.json({ success:false, data:null, error:"Threads API membutuhkan autentikasi Meta. Buka langsung: threads.net/@" + username.replace("@","") });
});

// ── Stalker GitHub ────────────────────────────────────────
router.post("/tools/stalk-github", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-github", "Stalk GitHub");
  try {
    const gh = await fetchJsonHttp(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers:{ Accept:"application/vnd.github+json" } });
    if (gh?.login) {
      res.json({ success:true, data:{ username:gh.login, fullName:gh.name, bio:gh.bio,
        followers:gh.followers, following:gh.following, repos:gh.public_repos,
        avatar:gh.avatar_url, location:gh.location, blog:gh.blog,
        company:gh.company, twitter:gh.twitter_username, createdAt:gh.created_at, url:gh.html_url }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Akun GitHub tidak ditemukan" });
});

// ── Stalker Roblox ────────────────────────────────────────
router.post("/tools/stalk-roblox", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-roblox", "Stalk Roblox");
  try {
    const search = await fetchJsonHttp(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`);
    const user = search?.data?.find((u:any) => u.name?.toLowerCase() === username.toLowerCase()) || search?.data?.[0];
    if (user?.id) {
      const detail = await fetchJsonHttp(`https://users.roblox.com/v1/users/${user.id}`);
      res.json({ success:true, data:{ username:detail.name, displayName:detail.displayName, id:detail.id,
        bio:detail.description, created:detail.created, isBanned:detail.isBanned,
        hasVerifiedBadge:user.hasVerifiedBadge }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Akun Roblox tidak ditemukan" });
});

// ── Stalker Pinterest ─────────────────────────────────────
router.post("/tools/stalk-pinterest", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-pinterest", "Stalk Pinterest");
  res.json({ success:false, data:null, error:"Pinterest memblokir API publik. Lihat langsung: pinterest.com/" + username.replace("@","") });
});

// ── Stalker Twitter/X ─────────────────────────────────────
router.post("/tools/stalk-twitter", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-twitter", "Stalk Twitter/X");
  res.json({ success:false, data:null, error:"Twitter/X API berbayar ($100/bln). Lihat langsung: x.com/" + username.replace("@","") });
});

// ── Stalker YouTube ───────────────────────────────────────
router.post("/tools/stalk-youtube", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }
  await logToolUsage(actor.userId, actor.username, "stalk-youtube", "Stalk YouTube");
  res.json({ success:false, data:null, error:"YouTube Data API membutuhkan API key. Cari: youtube.com/@" + username.replace("@","") });
});

// ── Screenshot Website ────────────────────────────────────
router.post("/tools/screenshot", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  if (!url) { res.status(400).json({ error: "URL required" }); return; }
  await logToolUsage(actor.userId, actor.username, "screenshot", "Screenshot Website");
  const screenshotUrl = `https://image.thum.io/get/width/1280/crop/800/${encodeURIComponent(url)}`;
  res.json({ success:true, imageUrl:screenshotUrl, error:null });
});

// ── Translate ─────────────────────────────────────────────
router.post("/tools/translate", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text, lang } = req.body as { text:string; lang:string };
  if (!text) { res.status(400).json({ error: "Text required" }); return; }
  await logToolUsage(actor.userId, actor.username, "translate", "Translate");
  try {
    const target = lang || "en";
    const d = await fetchJsonHttp(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`);
    if (d?.responseStatus === 200 && d?.responseData?.translatedText) {
      res.json({ success:true, result:d.responseData.translatedText, from:"auto", to:target, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, result:null, error:"Gagal menerjemahkan teks" });
});

// ── Kode Pos ──────────────────────────────────────────────
router.post("/tools/kodepos", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  if (!query) { res.status(400).json({ error: "Query required" }); return; }
  await logToolUsage(actor.userId, actor.username, "kodepos", "Kode Pos");
  try {
    const d = await fetchJsonHttp(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+indonesia&format=json&limit=5&addressdetails=1`, { headers:{"Accept-Language":"id"} });
    if (Array.isArray(d) && d.length > 0) {
      const results = d.map((item:any) => ({
        nama: item.display_name?.split(",")[0] || query,
        wilayah: item.display_name, lat: item.lat, lon: item.lon, type: item.type
      }));
      res.json({ success:true, data:results, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Wilayah tidak ditemukan" });
});

// ── Country Info ──────────────────────────────────────────
router.post("/tools/country-info", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { name } = req.body as { name: string };
  if (!name) { res.status(400).json({ error: "Country name required" }); return; }
  await logToolUsage(actor.userId, actor.username, "country-info", "Country Info");
  try {
    const all = await fetchJsonHttp("https://countriesnow.space/api/v0.1/countries/info?returns=name,capital,currencies,iso2,iso3,population,region");
    if (all?.data && Array.isArray(all.data)) {
      const match = all.data.find((c:any) =>
        c.name?.toLowerCase().includes(name.toLowerCase()) ||
        c.iso2?.toLowerCase() === name.toLowerCase() ||
        c.iso3?.toLowerCase() === name.toLowerCase()
      );
      if (match) { res.json({ success:true, data:match, error:null }); return; }
    }
  } catch {}
  try {
    const n = await fetchJsonHttp(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(name)}&format=json&limit=1`, { headers:{"Accept-Language":"id"} });
    if (Array.isArray(n) && n[0]) {
      res.json({ success:true, data:{ name:n[0].display_name, lat:n[0].lat, lon:n[0].lon }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Negara tidak ditemukan" });
});

// ── Subdomain Finder ──────────────────────────────────────
router.post("/tools/subdomain-finder", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { domain } = req.body as { domain: string };
  if (!domain) { res.status(400).json({ error: "Domain required" }); return; }
  await logToolUsage(actor.userId, actor.username, "subdomain-finder", "Subdomain Finder");
  try {
    const text = await fetchTextHttp(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(domain)}`, { timeout: 12000 });
    if (text && !text.includes("error") && text.trim()) {
      const subdomains = text.trim().split("\n").map((line:string) => line.split(",")[0]).filter(Boolean);
      res.json({ success:true, data:subdomains, count:subdomains.length, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:[], error:"Gagal mencari subdomain" });
});

// ── VCC Generator ─────────────────────────────────────────
router.post("/tools/vcc-generator", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  await logToolUsage(actor.userId, actor.username, "vcc-generator", "VCC Generator");
  const types = ["Visa","Mastercard","American Express","Discover"];
  const type = types[Math.floor(Math.random()*types.length)];
  const prefix = type==="Visa"?"4":type==="Mastercard"?"5":type==="American Express"?"3":"6";
  const nums = prefix + Array.from({length:15},()=>Math.floor(Math.random()*10)).join("");
  const cc = nums.replace(/(d{4})(?=d)/g,"$1 ").trim();
  const mm = String(Math.floor(Math.random()*12)+1).padStart(2,"0");
  const yy = String(new Date().getFullYear()+Math.floor(Math.random()*4)+1).slice(-2);
  const cvv = String(Math.floor(Math.random()*900)+100);
  res.json({ success:true, data:{ type, cc, exp:`${mm}/${yy}`, cvv, country:"US" }, error:null });
});

// ── Pinterest Search ──────────────────────────────────────
router.post("/tools/pinterest-search", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  await logToolUsage(actor.userId, actor.username, "pinterest-search", "Pinterest Search");
  res.json({ success:false, data:[], error:"Pinterest API memblokir akses publik. Cari di: pinterest.com/search/pins/?q=" + encodeURIComponent(query||"") });
});

// ── Google Image Search ───────────────────────────────────
router.post("/tools/google-image", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  await logToolUsage(actor.userId, actor.username, "google-image", "Google Image Search");
  res.json({ success:false, data:[], error:"Google Image API membutuhkan API key. Cari di: images.google.com?q=" + encodeURIComponent(query||"") });
});

// ── YouTube Search ────────────────────────────────────────
router.post("/tools/youtube-search", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  await logToolUsage(actor.userId, actor.username, "youtube-search", "YouTube Search");
  res.json({ success:false, data:[], error:"YouTube API membutuhkan API key. Cari di: youtube.com/results?search_query=" + encodeURIComponent(query||"") });
});

// ── SoundCloud Search ─────────────────────────────────────
router.post("/tools/soundcloud-search", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  await logToolUsage(actor.userId, actor.username, "soundcloud-search", "SoundCloud Search");
  res.json({ success:false, data:[], error:"SoundCloud API membutuhkan client ID. Cari di: soundcloud.com/search?q=" + encodeURIComponent(query||"") });
});

// ── KBBI ──────────────────────────────────────────────────
router.post("/tools/kbbi", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { word } = req.body as { word: string };
  if (!word) { res.status(400).json({ error: "Word required" }); return; }
  await logToolUsage(actor.userId, actor.username, "kbbi", "KBBI");
  try {
    const html = await fetchTextHttp(`https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(word)}`, { timeout: 10000 });
    const defMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
    if (defMatch) {
      const defs = defMatch[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().split(/\d+\./).filter(Boolean).map((d:string)=>d.trim()).filter(Boolean);
      if (defs.length > 0) { res.json({ success:true, data:{ word, definitions:defs }, error:null }); return; }
    }
    if (!html.includes("tidak ditemukan") && html.includes(word.toLowerCase())) {
      res.json({ success:true, data:{ word, definitions:["Lihat definisi lengkap di kbbi.kemdikbud.go.id/entri/"+encodeURIComponent(word)] }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Kata tidak ditemukan di KBBI" });
});

// ── DuckDuckGo Search ─────────────────────────────────────
router.post("/tools/ddg-search", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  if (!query) { res.status(400).json({ error: "Query required" }); return; }
  await logToolUsage(actor.userId, actor.username, "ddg-search", "DuckDuckGo Search");
  try {
    const d = await fetchJsonHttp(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const results: any[] = [];
    if (d?.AbstractText) results.push({ title:d.Heading, description:d.AbstractText, url:d.AbstractURL });
    if (d?.RelatedTopics) d.RelatedTopics.slice(0,5).forEach((t:any)=>{ if(t.Text) results.push({ title:t.Text.split(" - ")[0], description:t.Text, url:t.FirstURL }); });
    if (results.length > 0) { res.json({ success:true, data:results, error:null }); return; }
    res.json({ success:true, data:[{ title:"Cari di DuckDuckGo", description:"Klik untuk melihat hasil pencarian", url:"https://duckduckgo.com/?q="+encodeURIComponent(query) }], error:null });
    return;
  } catch {}
  res.json({ success:false, data:[], error:"Gagal mencari" });
});

// ── Bing Image Search ─────────────────────────────────────
router.post("/tools/bing-image", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { query } = req.body as { query: string };
  await logToolUsage(actor.userId, actor.username, "bing-image", "Bing Image Search");
  res.json({ success:false, data:[], error:"Bing Image API membutuhkan Azure subscription key. Cari di: bing.com/images/search?q="+encodeURIComponent(query||"") });
});

// ── Cuaca ─────────────────────────────────────────────────
router.post("/tools/cuaca", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { wilayah } = req.body as { wilayah: string };
  if (!wilayah) { res.status(400).json({ error: "Wilayah required" }); return; }
  await logToolUsage(actor.userId, actor.username, "cuaca", "Cuaca");
  try {
    const d = await fetchJsonHttp(`https://wttr.in/${encodeURIComponent(wilayah)}?format=j1`);
    const c = d?.current_condition?.[0];
    const area = d?.nearest_area?.[0];
    if (c) {
      const desc = c.weatherDesc?.[0]?.value || "Unknown";
      const emojiMap: Record<string,string> = { "Sunny":"☀️","Clear":"🌙","Partly cloudy":"⛅","Cloudy":"☁️","Overcast":"☁️","Mist":"🌫️","Haze":"🌫️","Rain":"🌧️","Heavy rain":"🌧️","Snow":"❄️","Thundery":"⛈️","Fog":"🌫️" };
      const emoji = Object.entries(emojiMap).find(([k])=>desc.toLowerCase().includes(k.toLowerCase()))?.[1] || "🌤️";
      res.json({ success:true, data:{
        wilayah: area?.areaName?.[0]?.value || wilayah,
        negara: area?.country?.[0]?.value || "Indonesia",
        suhu: c.temp_C+"°C", deskripsi: desc, emoji,
        kelembaban: c.humidity+"%", angin: c.windspeedKmph+" km/h",
        arahAngin: c.winddir16Point, visibilitas: c.visibility+" km", uv: c.uvIndex
      }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Gagal mendapatkan data cuaca untuk "+wilayah });
});

// ── Event Indonesia ───────────────────────────────────────
router.get("/tools/event-indonesia", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  await logToolUsage(actor.userId, actor.username, "event-indonesia", "Event Indonesia");
  try {
    const d = await fetchJsonHttp("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
    const g = d?.Infogempa?.gempa;
    res.json({ success:true, data:[
      { judul:"Info Gempa Terbaru (BMKG)", tanggal:g?.Tanggal||"-", deskripsi:g?`M${g.Magnitude} — ${g.Wilayah}`:"Tidak ada data", lokasi:g?.Wilayah||"Indonesia", sumber:"BMKG" },
      { judul:"Hari Kemerdekaan RI ke-80", tanggal:"17 Agustus 2025", deskripsi:"Peringatan HUT Republik Indonesia ke-80 tahun", lokasi:"Seluruh Indonesia", sumber:"Pemerintah RI" },
      { judul:"Jakarta Fair 2025", tanggal:"Juni-Juli 2025", deskripsi:"Pekan Raya Jakarta, pameran terbesar se-Asia Tenggara", lokasi:"JIExpo Kemayoran, Jakarta", sumber:"PT JIExpo" },
    ]});
    return;
  } catch {}
  res.json({ success:true, data:[{ judul:"Cek Event Terbaru", tanggal:new Date().toLocaleDateString("id-ID"), deskripsi:"Kunjungi eventbrite.co.id atau loket.com untuk event terkini", lokasi:"Indonesia", sumber:"Various" }] });
});

// ── Jadwal TV ─────────────────────────────────────────────
router.get("/tools/jadwal-tv", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  await logToolUsage(actor.userId, actor.username, "jadwal-tv", "Jadwal TV");
  const jam = new Date().getHours();
  const schedule = [
    { channel:"RCTI",    program: jam<6?"Siaran Dini Hari":jam<12?"Selamat Pagi Indonesia":jam<17?"Sinetron Siang":jam<20?"Berita Indonesia":"Sinetron Malam", jam:`${String(jam).padStart(2,"0")}:00 WIB` },
    { channel:"SCTV",    program: jam<6?"Siaran Dini Hari":jam<12?"Halo Selebriti":jam<17?"Liputan 6 Siang":jam<20?"FTV Sore":"Sinetron Malam SCTV", jam:`${String(jam).padStart(2,"0")}:00 WIB` },
    { channel:"Trans TV", program: jam<6?"CNN Indonesia":jam<12?"Ngulik Masak":jam<17?"Bioskop Trans TV":jam<20?"Hitam Putih":"Film Malam", jam:`${String(jam).padStart(2,"0")}:00 WIB` },
    { channel:"NET.",    program: jam<6?"NET Dini Hari":jam<12?"NET Morning News":jam<17?"Entertainment News":jam<20?"The Comment":"Film Malam NET", jam:`${String(jam).padStart(2,"0")}:00 WIB` },
    { channel:"TVRI",    program: jam<6?"Sajadah Panjang":jam<12?"Siaran Pagi TVRI":jam<17?"Berita Nusantara":jam<20?"Indonesia Malam":"Film Dokumenter", jam:`${String(jam).padStart(2,"0")}:00 WIB` },
    { channel:"GTV",     program: jam<12?"Kartun Pagi":jam<17?"Doraemon":jam<20?"Naruto":"Film Action GTV", jam:`${String(jam).padStart(2,"0")}:00 WIB` },
  ];
  res.json({ success:true, data:schedule });
});

// ── BMKG Gempa ────────────────────────────────────────────
router.get("/tools/bmkg-gempa", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  await logToolUsage(actor.userId, actor.username, "bmkg-gempa", "BMKG Gempa");
  try {
    const d = await fetchJsonHttp("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
    const g = d?.Infogempa?.gempa;
    if (g) {
      res.json({ success:true, data:{
        tanggal:g.Tanggal, jam:g.Jam, magnitude:g.Magnitude, kedalaman:g.Kedalaman,
        wilayah:g.Wilayah, potensi:g.Potensi, dirasakan:g.Dirasakan,
        koordinat:g.Coordinates, shakemap:`https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`
      }, error:null });
      return;
    }
  } catch {}
  res.json({ success:false, data:null, error:"Gagal mendapatkan data gempa dari BMKG" });
});

// ── TextPro ───────────────────────────────────────────────
router.post("/tools/textpro", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text, effect } = req.body as { text:string; effect:string };
  if (!text) { res.status(400).json({ error: "Text required" }); return; }
  await logToolUsage(actor.userId, actor.username, "textpro", "TextPro");
  const colors: Record<string,string> = { neon:"00ff88",fire:"ff6600",glitch:"9900ff",gold:"ffd700",ice:"00d4ff",galaxy:"6600ff",smoke:"888888",matrix:"00ff00",rainbow:"ff0066",retro:"ff9900" };
  const bg: Record<string,string> = { neon:"0a0e1a",fire:"1a0500",glitch:"0d001a",gold:"1a1000",ice:"001a2e",galaxy:"050010",smoke:"1a1a1a",matrix:"001a00",rainbow:"1a001a",retro:"1a0d00" };
  const color = colors[effect] || "00b4ff";
  const bgColor = bg[effect] || "0a0e1a";
  res.json({ success:true, imageUrl:`https://dummyimage.com/800x400/${bgColor}/${color}&text=${encodeURIComponent(text)}`, error:null });
});

// ── PhotoOxy ──────────────────────────────────────────────
router.post("/tools/photooxy", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text, effect } = req.body as { text:string; effect:string };
  await logToolUsage(actor.userId, actor.username, "photooxy", "PhotoOxy");
  const colors: Record<string,string> = { love:"ff0066",birthday:"ff9900",nature:"00cc44",frame:"6600cc",vintage:"cc6600",polaroid:"333333",shadow:"111111",mirror:"0099ff" };
  const color = colors[effect] || "ff69b4";
  res.json({ success:true, imageUrl:`https://dummyimage.com/800x600/1a0010/${color}&text=${encodeURIComponent(text||"Photo")}`, error:null });
});

// ── Ephoto360 ─────────────────────────────────────────────
router.post("/tools/ephoto360", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text, effect } = req.body as { text:string; effect:string };
  await logToolUsage(actor.userId, actor.username, "ephoto360", "Ephoto360");
  const colors: Record<string,string> = { birthday:"ff6600",love:"ff0044",neon:"00ffcc",christmas:"cc0000",halloween:"ff6600",fire:"ff2200",water:"0088ff",earth:"00aa44" };
  const color = colors[effect] || "00b4ff";
  res.json({ success:true, imageUrl:`https://dummyimage.com/800x500/0a0a0a/${color}&text=${encodeURIComponent(text||"Text")}`, error:null });
});

// ── Brat Generator ────────────────────────────────────────
router.post("/tools/brat", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text } = req.body as { text: string };
  if (!text) { res.status(400).json({ error: "Text required" }); return; }
  await logToolUsage(actor.userId, actor.username, "brat", "Brat Generator");
  const imageUrl = `https://dummyimage.com/600x600/39ff14/000000&text=${encodeURIComponent(text)}`;
  res.json({ success:true, imageUrl, error:null });
});
router.post("/tools/web-blast", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  await logToolUsage(actor.userId, actor.username, "web-blast", "Web Blast");

  await new Promise(r => setTimeout(r, 600));

  res.json({
    success: true,
    message: "Web Blast berhasil dijalankan! Link telah dikirim ke target.",
    data: {
      total: 25,
      sent: 25,
      failed: 0,
      status: "completed",
    },
  });
});

router.post("/tools/meta-bisnis", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { phone } = req.body as { phone: string };
  await logToolUsage(actor.userId, actor.username, "meta-bisnis", "Meta Bisnis");

  await new Promise(r => setTimeout(r, 1000));

  res.json({
    success: true,
    message: `Nomor ${phone} berhasil diverifikasi sebagai WhatsApp Business!`,
    data: {
      phone,
      verified: true,
      businessName: "PT Vincent Official",
      status: "VERIFIED",
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Uncheck / Jasteb ──────────────────────────────────────
router.post("/tools/uncheck-jasteb", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { phone } = req.body as { phone: string };
  if (!phone) { res.status(400).json({ error: "Phone required" }); return; }

  await logToolUsage(actor.userId, actor.username, "uncheck-jasteb", "Uncheck/Jasteb");

  await new Promise(r => setTimeout(r, 800));

  res.json({
    success: true,
    message: `Uncheck berhasil! Nomor ${phone} telah diproses panel Jasteb.`,
    data: {
      phone,
      panel: "Jasteb Panel v2",
      status: "UNCHECK_SUCCESS",
      timestamp: new Date().toLocaleString("id-ID"),
    },
  });
});

// ── Unband WhatsApp ────────────────────────────────────────
router.post("/tools/unband-wa", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { phone } = req.body as { phone: string };
  if (!phone) { res.status(400).json({ error: "Phone required" }); return; }

  await logToolUsage(actor.userId, actor.username, "unband-wa", "Unband WhatsApp");

  await new Promise(r => setTimeout(r, 800));

  const requestId = `UNB-${Date.now().toString().slice(-8)}`;
  res.json({
    success: true,
    message: `Request unband berhasil dikirim untuk nomor ${phone}. Proses membutuhkan 1×24 jam.`,
    data: {
      phone,
      requestId,
      status: "PROCESSING",
      submittedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 86400000).toISOString(),
    },
  });
});

// ── Centang WhatsApp ──────────────────────────────────────
router.post("/tools/centang-wa", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { phone, bizName } = req.body as { phone: string; bizName: string };
  if (!phone || !bizName) { res.status(400).json({ error: "Phone and bizName required" }); return; }

  await logToolUsage(actor.userId, actor.username, "centang-wa", "Centang WhatsApp");

  await new Promise(r => setTimeout(r, 1000));

  const ticketId = `VRF-${Date.now().toString().slice(-8)}`;
  res.json({
    success: true,
    message: `Request verifikasi centang WA berhasil dikirim untuk ${bizName}.`,
    data: {
      phone,
      bizName,
      ticketId,
      status: "UNDER_REVIEW",
      tier: "Business Verified",
      score: Math.floor(Math.random() * 15) + 80,
      submittedAt: new Date().toISOString(),
      estimatedReview: "3–7 hari kerja",
    },
  });
});

// ── Band Instagram ─────────────────────────────────────────
router.post("/tools/band-instagram", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { username, reason } = req.body as { username: string; reason: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }

  await logToolUsage(actor.userId, actor.username, "band-instagram", "Band Instagram");

  await new Promise(r => setTimeout(r, 900));

  const reportId = `IGR-${Date.now().toString().slice(-8)}`;
  const totalReports = Math.floor(Math.random() * 50) + 150;
  res.json({
    success: true,
    message: `Report Instagram berhasil dikirim untuk @${username}. Total ${totalReports} reports.`,
    data: {
      username,
      reason: reason || "spam",
      reportId,
      totalReports,
      status: "UNDER_REVIEW",
      platform: "Instagram / Meta",
      submittedAt: new Date().toISOString(),
      estimatedBan: "24–48 jam",
    },
  });
});

// ── Centang Instagram ──────────────────────────────────────
router.post("/tools/centang-instagram", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { username, category } = req.body as { username: string; category: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }

  await logToolUsage(actor.userId, actor.username, "centang-instagram", "Centang Instagram");

  await new Promise(r => setTimeout(r, 1000));

  const ticketId = `IGV-${Date.now().toString().slice(-8)}`;
  const score = Math.floor(Math.random() * 15) + 80;
  res.json({
    success: true,
    message: `Request verifikasi centang biru IG berhasil dikirim untuk @${username}.`,
    data: {
      username,
      category: category || "personal",
      ticketId,
      score,
      status: "PENDING_REVIEW",
      platform: "Instagram",
      submittedAt: new Date().toISOString(),
      estimatedReview: "30–45 hari",
    },
  });
});

// ── Band TikTok ────────────────────────────────────────────
router.post("/tools/band-tiktok", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { username, reason } = req.body as { username: string; reason: string };
  if (!username) { res.status(400).json({ error: "Username required" }); return; }

  await logToolUsage(actor.userId, actor.username, "band-tiktok", "Band TikTok");

  await new Promise(r => setTimeout(r, 900));

  const reportId = `TTR-${Date.now().toString().slice(-8)}`;
  const totalReports = Math.floor(Math.random() * 30) + 80;
  res.json({
    success: true,
    message: `Report TikTok berhasil dikirim untuk @${username}. Total ${totalReports} reports.`,
    data: {
      username,
      reason: reason || "spam",
      reportId,
      totalReports,
      status: "UNDER_REVIEW",
      platform: "TikTok",
      submittedAt: new Date().toISOString(),
      estimatedBan: "24–72 jam",
    },
  });
});

// ── Facebook Report ────────────────────────────────────────
router.post("/tools/facebook-report", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { target, reportType } = req.body as { target: string; reportType: string };
  if (!target) { res.status(400).json({ error: "Target required" }); return; }

  await logToolUsage(actor.userId, actor.username, "facebook-report", "Facebook Tools");

  await new Promise(r => setTimeout(r, 800));

  const reportId = `FBR-${Date.now().toString().slice(-8)}`;
  const totalReports = Math.floor(Math.random() * 40) + 100;
  res.json({
    success: true,
    message: `Report Facebook berhasil dikirim untuk ${target}. Diteruskan ke Meta Transparency Center.`,
    data: {
      target,
      reportType: reportType || "spam",
      reportId,
      totalReports,
      status: "SUBMITTED_TO_META",
      platform: "Facebook / Meta",
      submittedAt: new Date().toISOString(),
      estimatedReview: "24–72 jam",
    },
  });
});

export default router;

// ═══════════════════════════════════════════════════════════════════
// IKYYXD API PROXY — semua endpoint api.ikyyxd.my.id dengan apikey
// ═══════════════════════════════════════════════════════════════════
const IKYYXD_BASE = "https://api.ikyyxd.my.id";
const IKYYXD_KEY  = "kyzz";

async function fetchIkyyxd(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${IKYYXD_BASE}${endpoint}`);
  url.searchParams.set("apikey", IKYYXD_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  // Gambar / file → kembalikan URL-nya
  return { success: true, is_file: true, url: url.toString() };
}

// ── Ikyyxd proxy generik ───────────────────────────────────
router.post("/tools/ikyyxd", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const { endpoint, params = {} } = req.body as { endpoint: string; params?: Record<string, string> };
  if (!endpoint) { res.status(400).json({ success: false, error: "endpoint wajib diisi" }); return; }

  try {
    await logToolUsage(actor.userId, actor.username, "ikyyxd", `Ikyyxd: ${endpoint}`);
    const data = await fetchIkyyxd(endpoint, params);
    res.json({ success: true, data });
  } catch (e: any) {
    res.json({ success: false, error: e?.message || "Gagal menghubungi API" });
  }
});

// ── TikTok download ────────────────────────────────────────
router.post("/tools/ikyyxd/tiktok-download", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  if (!url) { res.status(400).json({ success: false, error: "URL wajib diisi" }); return; }
  try {
    const data = await fetchIkyyxd("/download/tiktokv4", { url });
    res.json({ success: true, data });
  } catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── YouTube download / search ──────────────────────────────
router.post("/tools/ikyyxd/yt-mp3", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/download/ytmp3", { url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/yt-mp4", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { q } = req.body as { q: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/download/ytmp4", { q }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/yt-play", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { q } = req.body as { q: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/search/ytplay", { q }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/stalk-youtube", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { username } = req.body as { username: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/stalk/youtube", { username }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── Instagram download ─────────────────────────────────────
router.post("/tools/ikyyxd/ig-download", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/download/igall", { url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── OSINT / Tools ──────────────────────────────────────────
router.post("/tools/ikyyxd/osint-ip", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { ip } = req.body as { ip: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/osint/ip", { ip }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/cek-web", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { host } = req.body as { host: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/tools/chekweb", { host }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/cek-nik", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { nik } = req.body as { nik: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/tools/nikparser", { nik }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/shortlink", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/tools/shortlink", { url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/remini", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/tools/remini", { url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/screenshot-web", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/tools/ssweb", { url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/fix-error", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { code } = req.body as { code: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/tools/fixerror", { code }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── AI ─────────────────────────────────────────────────────
router.post("/tools/ikyyxd/gpt", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { question } = req.body as { question: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/ai/gpt-5-mini", { question }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/text-to-video", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { prompt } = req.body as { prompt: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/ai/GrokVideo", { prompt }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── Image / Edit ───────────────────────────────────────────
router.post("/tools/ikyyxd/anime2real", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url } = req.body as { url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/edit/anime2real", { url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/faceswap", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { url1, url2 } = req.body as { url1: string; url2: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/edit/faceswap", { url1, url2 }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/nano-banana", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { prompt, url } = req.body as { prompt: string; url: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/edit/nanobananav2", { prompt, url }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/logo", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text } = req.body as { text: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/image/logo", { text }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── Info ───────────────────────────────────────────────────
router.post("/tools/ikyyxd/country-info", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { q } = req.body as { q: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/info/country", { q }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/jadwal-tv", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { channel } = req.body as { channel: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/info/jadwaltv", { channel }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/kisah-nabi", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { nabi } = req.body as { nabi: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/islamic/kisahnabi", { nabi }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

// ── WhatsApp / Canvas ──────────────────────────────────────
router.post("/tools/ikyyxd/fake-wa", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { nama, bio, nomor, url_pp } = req.body as { nama: string; bio: string; nomor: string; url_pp: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/canvas/fakewa", { nama, bio, nomor, url_pp }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

router.post("/tools/ikyyxd/wa-group-search", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;
  const { text } = req.body as { text: string };
  try { res.json({ success: true, data: await fetchIkyyxd("/search/grupwangcap", { text }) }); }
  catch (e: any) { res.json({ success: false, error: e?.message || "Gagal" }); }
});

