import { useState, useCallback } from "react";
import {
  Instagram, Wallet, Bug, Globe, Building2, Facebook,
  IdCard, Phone, ShoppingCart, Gift, CheckCircle, Bot,
  Download, Search, ExternalLink, Github, Twitter, Youtube,
  Camera, Languages, MapPin, Flag, Radar, CreditCard,
  Image, Music, BookOpen, Wind, Tv, AlertTriangle,
  Type, Sparkles, Zap, Hash
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useNglSpam, useFakeDana, useWebBlast,
  useMetaBisnis, useNikCheck, usePhoneLookup, useChatAi,
  useDownloadMedia, useIgStalk
} from "@workspace/api-client-react";
import { CONFIG } from "@/config";

// Helper: panggil endpoint baru langsung tanpa codegen
async function callTool(path: string, body: Record<string, unknown>) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function callToolGet(path: string) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return res.json();
}

const tools = [
  // ── Tools Utama ────────────────────────────────────────
  { id: "ngl",       name: "NGL Spammer",    desc: "Anonymous Message",   icon: <Instagram className="w-6 h-6 text-white" />,    bg: "from-pink-500 to-rose-600",      cat: "Social" },
  { id: "dana",      name: "Fake DANA",       desc: "Generate Struk",      icon: <Wallet className="w-6 h-6 text-white" />,       bg: "from-blue-500 to-indigo-600",    cat: "Finance" },
  { id: "merah",     name: "Fix Merah",       desc: "Tutorial Fix Red",    icon: <Bug className="w-6 h-6 text-white" />,          bg: "from-red-500 to-red-700",        cat: "WA" },
  { id: "web",       name: "Web Blast",       desc: "Kumpulan Link",       icon: <Globe className="w-6 h-6 text-white" />,        bg: "from-cyan-500 to-blue-600",      cat: "Tools" },
  { id: "vjcent",    name: "VJ Cent",         desc: "Benefit & Join",      icon: <Building2 className="w-6 h-6 text-white" />,    bg: "from-[#00b4ff] to-[#1e90ff]",   cat: "Info" },
  { id: "meta",      name: "Meta Bisnis",     desc: "Verifikasi WA Bisnis",icon: <Facebook className="w-6 h-6 text-white" />,     bg: "from-blue-600 to-blue-800",      cat: "WA" },
  { id: "nik",       name: "NIK Check",       desc: "Cek Data KTP",        icon: <IdCard className="w-6 h-6 text-white" />,       bg: "from-[#00b4ff] to-[#1e90ff]",   cat: "Info" },
  { id: "phone",     name: "Phone Lookup",    desc: "Cek Nomor Telepon",   icon: <Phone className="w-6 h-6 text-white" />,        bg: "from-[#00b4ff] to-[#1e90ff]",   cat: "Info" },
  { id: "nokos_buy", name: "Buy Nokos",       desc: "Beli Nokos",          icon: <ShoppingCart className="w-6 h-6 text-white" />, bg: "from-[#00b4ff] to-[#1e90ff]",   cat: "Shop" },
  { id: "nokos_gch", name: "Gacha Nokos",     desc: "Gacha Nokos",         icon: <Gift className="w-6 h-6 text-white" />,         bg: "from-purple-500 to-indigo-600",  cat: "Shop" },
  { id: "uncheck",   name: "Uncheck/Jasteb",  desc: "Panel Uncheck",       icon: <CheckCircle className="w-6 h-6 text-white" />,  bg: "from-green-500 to-green-700",    cat: "WA" },
  { id: "chat",      name: "Chat AI",         desc: "AI Meta Assistant",   icon: <Bot className="w-6 h-6 text-white" />,          bg: "from-violet-500 to-purple-700",  cat: "AI" },
  // ── Downloader ─────────────────────────────────────────
  { id: "download",  name: "Downloader",      desc: "Download Sosmed",     icon: <Download className="w-6 h-6 text-white" />,     bg: "from-orange-500 to-red-500",     cat: "Download" },
  // ── Stalker ────────────────────────────────────────────
  { id: "ig",        name: "Stalk Instagram", desc: "Info Akun IG",        icon: <Instagram className="w-6 h-6 text-white" />,    bg: "from-pink-500 to-purple-600",    cat: "Stalk" },
  { id: "stk-tiktok",name: "Stalk TikTok",   desc: "Info Akun TikTok",    icon: <Hash className="w-6 h-6 text-white" />,         bg: "from-black to-gray-700",         cat: "Stalk" },
  { id: "stk-threads",name:"Stalk Threads",  desc: "Info Akun Threads",   icon: <Hash className="w-6 h-6 text-white" />,         bg: "from-gray-700 to-gray-900",      cat: "Stalk" },
  { id: "stk-github",name: "Stalk GitHub",   desc: "Info Akun GitHub",    icon: <Github className="w-6 h-6 text-white" />,       bg: "from-gray-800 to-gray-950",      cat: "Stalk" },
  { id: "stk-roblox",name: "Stalk Roblox",   desc: "Info Akun Roblox",    icon: <Zap className="w-6 h-6 text-white" />,          bg: "from-red-600 to-red-800",        cat: "Stalk" },
  { id: "stk-pinterest",name:"Stalk Pinterest",desc:"Info Akun Pinterest", icon: <Image className="w-6 h-6 text-white" />,        bg: "from-red-500 to-rose-700",       cat: "Stalk" },
  { id: "stk-twitter",name:"Stalk Twitter/X", desc:"Info Akun Twitter/X", icon: <Twitter className="w-6 h-6 text-white" />,      bg: "from-sky-500 to-blue-700",       cat: "Stalk" },
  { id: "stk-youtube",name:"Stalk YouTube",  desc: "Info Channel YouTube", icon: <Youtube className="w-6 h-6 text-white" />,     bg: "from-red-500 to-red-700",        cat: "Stalk" },
  // ── Tools Tambahan ─────────────────────────────────────
  { id: "qr",        name: "QR Generator",    desc: "Buat QR Code",        icon: <Hash className="w-6 h-6 text-white" />,         bg: "from-green-500 to-emerald-700",  cat: "Create" },
  { id: "screenshot",name: "Screenshot Web", desc: "Screenshot Website",  icon: <Camera className="w-6 h-6 text-white" />,       bg: "from-teal-500 to-cyan-700",      cat: "Tools" },
  { id: "translate", name: "Translate",       desc: "Terjemahkan Teks",    icon: <Languages className="w-6 h-6 text-white" />,    bg: "from-emerald-500 to-green-700",  cat: "Tools" },
  { id: "kodepos",   name: "Kode Pos",        desc: "Cari Kode Pos",       icon: <MapPin className="w-6 h-6 text-white" />,       bg: "from-yellow-500 to-orange-600",  cat: "Info" },
  { id: "country",   name: "Country Info",    desc: "Info Negara",         icon: <Flag className="w-6 h-6 text-white" />,         bg: "from-blue-400 to-blue-700",      cat: "Info" },
  { id: "subdomain", name: "Subdomain Finder",desc: "Cari Subdomain",      icon: <Radar className="w-6 h-6 text-white" />,        bg: "from-violet-600 to-purple-800",  cat: "Tools" },
  { id: "vcc",       name: "VCC Generator",   desc: "Generate Kartu VCC",  icon: <CreditCard className="w-6 h-6 text-white" />,   bg: "from-amber-500 to-yellow-600",   cat: "Finance" },
  { id: "pinterestsearch",name:"Pinterest Search",desc:"Cari di Pinterest", icon: <Search className="w-6 h-6 text-white" />,      bg: "from-red-400 to-rose-600",       cat: "Search" },
  { id: "googleimage",name:"Google Image",    desc: "Cari Gambar Google",  icon: <Image className="w-6 h-6 text-white" />,        bg: "from-blue-500 to-indigo-700",    cat: "Search" },
  { id: "ytsearch",  name: "YouTube Search",  desc: "Cari Video YouTube",  icon: <Youtube className="w-6 h-6 text-white" />,     bg: "from-red-600 to-red-800",        cat: "Search" },
  { id: "scsearch",  name: "SoundCloud Search",desc:"Cari di SoundCloud",  icon: <Music className="w-6 h-6 text-white" />,       bg: "from-orange-500 to-orange-700",  cat: "Search" },
  { id: "kbbi",      name: "KBBI",            desc: "Kamus Besar RI",      icon: <BookOpen className="w-6 h-6 text-white" />,     bg: "from-green-600 to-teal-700",     cat: "Info" },
  { id: "ddgsearch", name: "DuckDuckGo",      desc: "Search DuckDuckGo",   icon: <Search className="w-6 h-6 text-white" />,       bg: "from-orange-400 to-orange-700",  cat: "Search" },
  { id: "bingimage", name: "Bing Image",      desc: "Cari Gambar Bing",    icon: <Image className="w-6 h-6 text-white" />,        bg: "from-teal-400 to-cyan-600",      cat: "Search" },
  { id: "cuaca",     name: "Cuaca",           desc: "Info Cuaca Wilayah",  icon: <Wind className="w-6 h-6 text-white" />,         bg: "from-sky-400 to-blue-600",       cat: "Info" },
  { id: "eventid",   name: "Event Indonesia", desc: "Event Terbaru",       icon: <Flag className="w-6 h-6 text-white" />,         bg: "from-red-400 to-red-700",        cat: "Info" },
  { id: "jadwaltv",  name: "Jadwal TV",       desc: "Jadwal Acara TV",     icon: <Tv className="w-6 h-6 text-white" />,           bg: "from-indigo-500 to-purple-700",  cat: "Info" },
  { id: "bmkg",      name: "BMKG Gempa",      desc: "Info Gempa Terbaru",  icon: <AlertTriangle className="w-6 h-6 text-white" />,bg: "from-orange-600 to-red-700",    cat: "Info" },
  { id: "textpro",   name: "TextPro",         desc: "Efek Teks Keren",     icon: <Type className="w-6 h-6 text-white" />,         bg: "from-fuchsia-500 to-purple-700", cat: "Create" },
  { id: "photooxy",  name: "PhotoOxy",        desc: "Efek Foto Keren",     icon: <Sparkles className="w-6 h-6 text-white" />,     bg: "from-pink-500 to-fuchsia-700",   cat: "Create" },
  { id: "ephoto360", name: "Ephoto360",       desc: "Template Foto Online",icon: <Sparkles className="w-6 h-6 text-white" />,     bg: "from-violet-500 to-pink-600",    cat: "Create" },
  { id: "brat",      name: "Brat Generator",  desc: "Generate Brat Image", icon: <Zap className="w-6 h-6 text-white" />,          bg: "from-lime-400 to-green-600",     cat: "Create" },
  // ── Ikyyxd Tools ───────────────────────────────────────
  { id: "iky-tiktok-dl",  name: "TikTok Download",   desc: "Download Video TikTok",     icon: <Download className="w-6 h-6 text-white" />,  bg: "from-black to-gray-700",        cat: "Download" },
  { id: "iky-yt-mp3",     name: "YouTube MP3",        desc: "Download Audio YouTube",    icon: <Music className="w-6 h-6 text-white" />,     bg: "from-red-600 to-red-800",       cat: "Download" },
  { id: "iky-yt-mp4",     name: "YouTube MP4",        desc: "Download Video YouTube",    icon: <Youtube className="w-6 h-6 text-white" />,   bg: "from-red-500 to-red-700",       cat: "Download" },
  { id: "iky-yt-play",    name: "YouTube Play",       desc: "Putar Audio YouTube",       icon: <Music className="w-6 h-6 text-white" />,     bg: "from-red-600 to-orange-700",    cat: "Download" },
  { id: "iky-ig-dl",      name: "Instagram DL",       desc: "Download IG Reel/Post",     icon: <Instagram className="w-6 h-6 text-white" />, bg: "from-pink-500 to-rose-700",     cat: "Download" },
  { id: "iky-gpt",        name: "GPT-5 Mini",         desc: "AI Chat GPT-5",             icon: <Bot className="w-6 h-6 text-white" />,       bg: "from-green-500 to-teal-700",    cat: "AI" },
  { id: "iky-txt2vid",    name: "Text to Video",      desc: "Generate Video dari Teks",  icon: <Sparkles className="w-6 h-6 text-white" />,  bg: "from-violet-600 to-purple-800", cat: "AI" },
  { id: "iky-osint-ip",   name: "OSINT IP",           desc: "Lacak Info IP Address",     icon: <Radar className="w-6 h-6 text-white" />,     bg: "from-green-700 to-emerald-900", cat: "Tools" },
  { id: "iky-cek-web",    name: "Cek Website",        desc: "Status & Info Website",     icon: <Globe className="w-6 h-6 text-white" />,     bg: "from-cyan-600 to-blue-800",     cat: "Tools" },
  { id: "iky-shortlink",  name: "Short Link",         desc: "Perpendek URL TinyURL",     icon: <ExternalLink className="w-6 h-6 text-white" />, bg: "from-orange-500 to-amber-700", cat: "Tools" },
  { id: "iky-ssweb",      name: "Screenshot Web",     desc: "Screenshot Website Online", icon: <Camera className="w-6 h-6 text-white" />,    bg: "from-teal-500 to-cyan-700",     cat: "Tools" },
  { id: "iky-fix-error",  name: "Fix Error Code",     desc: "Perbaiki Bug/Error Code",   icon: <Bug className="w-6 h-6 text-white" />,       bg: "from-red-600 to-rose-800",      cat: "Tools" },
  { id: "iky-remini",     name: "Remini AI",          desc: "Perjernih Foto Buram",      icon: <Sparkles className="w-6 h-6 text-white" />,  bg: "from-blue-500 to-indigo-700",   cat: "Create" },
  { id: "iky-logo",       name: "Logo Generator",     desc: "Generate Logo dari Teks",   icon: <Type className="w-6 h-6 text-white" />,      bg: "from-amber-500 to-orange-700",  cat: "Create" },
  { id: "iky-anime2real", name: "Anime to Real",      desc: "Ubah Gambar Anime ke Nyata", icon: <Image className="w-6 h-6 text-white" />,    bg: "from-purple-500 to-pink-700",   cat: "Create" },
  { id: "iky-faceswap",   name: "Face Swap",          desc: "Tukar Wajah 2 Foto",        icon: <Camera className="w-6 h-6 text-white" />,    bg: "from-rose-500 to-red-700",      cat: "Create" },
  { id: "iky-kisah-nabi", name: "Kisah Nabi",         desc: "Cerita Para Nabi Islam",    icon: <BookOpen className="w-6 h-6 text-white" />,  bg: "from-emerald-600 to-green-800", cat: "Info" },
  { id: "iky-country",    name: "Info Negara",        desc: "Detail Info Suatu Negara",  icon: <Flag className="w-6 h-6 text-white" />,      bg: "from-blue-600 to-indigo-800",   cat: "Info" },
  { id: "iky-jadwal-tv",  name: "Jadwal TV Premium",  desc: "Jadwal Acara TV",           icon: <Tv className="w-6 h-6 text-white" />,        bg: "from-indigo-500 to-purple-700", cat: "Info" },
  { id: "iky-fake-wa",    name: "Fake WA Profile",    desc: "Buat Profil WA Palsu",      icon: <Facebook className="w-6 h-6 text-white" />,  bg: "from-green-600 to-teal-800",    cat: "Social" },
  { id: "iky-wa-group",   name: "WA Group Search",    desc: "Cari Grup WhatsApp",        icon: <Search className="w-6 h-6 text-white" />,    bg: "from-emerald-500 to-green-700", cat: "Social" },
  { id: "iky-stk-yt",     name: "Stalk YouTube",      desc: "Info Channel YouTube",      icon: <Youtube className="w-6 h-6 text-white" />,   bg: "from-red-500 to-rose-700",      cat: "Stalk" },
];

// daftar kategori untuk filter
const CATEGORIES = ["Semua", "Social", "Finance", "WA", "Download", "Stalk", "Search", "Info", "Tools", "AI", "Create", "Shop"];

export default function Tools() {
  const [selected, setSelected] = useState<typeof tools[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = tools.filter(t => {
    const matchCat = activeCategory === "Semua" || t.cat === activeCategory;
    const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4">
      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari tool..."
            className="w-full pl-9 pr-4 py-2 bg-[#0a0e1a] border border-[#00b4ff]/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#00b4ff]"
          />
        </div>
      </div>

      {/* Kategori filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-[#00b4ff] text-white" : "bg-[#0a0e1a] border border-[#00b4ff]/30 text-gray-400"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <h2 className="text-xs font-bold text-gray-400 mb-4 tracking-widest">
        {activeCategory === "Semua" ? "SEMUA TOOLS" : activeCategory.toUpperCase()} — {filtered.length} TERSEDIA
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelected(tool)}
            className="cyber-card p-4 flex flex-col items-center text-center gap-3 transition-all hover:scale-105 active:scale-95"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${tool.bg} rounded-2xl flex items-center justify-center shadow-lg`}>
              {tool.icon}
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">{tool.name}</div>
              <div className="text-[10px] text-gray-400 mt-1">{tool.desc}</div>
              <div className="text-[9px] text-[#00b4ff]/60 mt-0.5 font-mono">{tool.cat}</div>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-[#0a0e1a]/97 backdrop-blur-xl border-t border-[#00b4ff]/50 px-4 pt-6 pb-24 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${selected.bg} rounded-2xl flex items-center justify-center shadow-lg`}>
                    {selected.icon}
                  </div>
                  <div className="text-left">
                    <SheetTitle className="text-white cyber-glow-text text-xl">{selected.name}</SheetTitle>
                    <div className="text-sm text-[#00b4ff]">{selected.desc}</div>
                  </div>
                </div>
              </SheetHeader>
              <ToolForm toolId={selected.id} />
            </>
          )}
        </SheetContent>
      </Sheet>

      <div className="text-center mt-8 pb-4">
        <p className="text-[10px] text-gray-500 font-mono">Dev {CONFIG.DEV} | Channel: {CONFIG.CHANNEL} | Tools: {CONFIG.TOOLS_NAME}</p>
      </div>
    </div>
  );
}

// ── Komponen Struk DANA ───────────────────────────────────
function DanaReceipt({ name, amount, note, datetime }: { name: string; amount: string; note?: string; datetime: string }) {
  const nominal = isNaN(Number(amount)) ? amount : `Rp${Number(amount).toLocaleString("id-ID")}`;
  const txnId = `TXN${Date.now().toString().slice(-10)}`;
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}
      className="mx-auto max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-blue-300">
      {/* Header biru DANA */}
      <div className="bg-[#108EE9] px-5 pt-6 pb-10 text-center relative">
        <div className="text-white font-black text-3xl tracking-widest mb-1">DANA</div>
        <div className="text-blue-100 text-xs">Kirim Uang</div>
        {/* Bulatan dekoratif */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#f5f7fa] rounded-full border-4 border-blue-300 flex items-center justify-center">
          <span className="text-green-500 text-lg font-black">✓</span>
        </div>
      </div>
      {/* Body putih */}
      <div className="bg-[#f5f7fa] px-5 pt-8 pb-5 space-y-4">
        <div className="text-center mb-2">
          <div className="text-gray-500 text-xs mb-1">Transfer Berhasil</div>
          <div className="text-[#108EE9] font-black text-2xl">{nominal}</div>
        </div>
        <hr className="border-dashed border-gray-300" />
        <div className="space-y-2 text-sm">
          <Row label="Kepada" value={name} />
          <Row label="Catatan" value={note || "—"} />
          <Row label="Waktu" value={datetime} />
          <Row label="No. Ref" value={txnId} mono />
        </div>
        <hr className="border-dashed border-gray-300" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Status</span>
          <span className="text-green-600 font-bold text-xs px-3 py-1 bg-green-100 rounded-full">✓ BERHASIL</span>
        </div>
        <div className="text-center text-[9px] text-gray-400 pt-1">
          DANA — Dompet Digital Indonesia
        </div>
      </div>
    </div>
  );
}
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-gray-800 font-medium text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

// ── Helper render list hasil ──────────────────────────────
function ResultCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl text-sm space-y-2">
      {Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2">
          <span className="text-gray-400 capitalize shrink-0">{k.replace(/_/g, " ")}</span>
          <span className="text-white text-right break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Image result ─────────────────────────────────────────
function ImageResult({ url }: { url: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#00b4ff]/30">
      <img src={url} alt="result" className="w-full max-h-64 object-contain bg-black" />
      <a href={url} target="_blank" rel="noreferrer" download>
        <Button className="w-full rounded-none bg-[#00b4ff]/20 hover:bg-[#00b4ff]/40 text-[#00b4ff] border-t border-[#00b4ff]/30 text-xs h-9">
          <Download className="w-3 h-3 mr-1" /> Simpan Gambar
        </Button>
      </a>
    </div>
  );
}

// ── Grid gambar hasil search ──────────────────────────────
function ImageGrid({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.slice(0, 10).map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={`result-${i}`} className="w-full h-28 object-cover rounded-lg border border-[#00b4ff]/20" />
        </a>
      ))}
    </div>
  );
}


// ─────────────────── Progress System ────────────────────
const PROGRESS_STEPS_GENERIC = [
  'Validating Data...',
  'Preparing System...',
  'Connecting to Server...',
  'Processing Request...',
  'Finalizing...',
  'Generating Result...',
];

const PROGRESS_STEPS_BY_TOOL: Record<string, string[]> = {
  ngl:      ['Validating Input...','Connecting to NGL...','Preparing Messages...','Sending Spam...','Verifying Delivery...','Done!'],
  dana:     ['Validating Data...','Preparing Template...','Generating Receipt...','Applying Signature...','Finalizing Receipt...','Complete!'],
  phone:    ['Validating Number...','Connecting to Database...','Fetching Carrier Data...','Analyzing Region...','Compiling Result...','Done!'],
  nik:      ['Validating NIK...','Connecting to Dukcapil...','Fetching Identity Data...','Decoding NIK Info...','Compiling Result...','Complete!'],
  ig:       ['Validating Username...','Connecting to Instagram...','Fetching Profile Data...','Analyzing Account...','Building Report...','Done!'],
  download: ['Detecting Platform...','Extracting URL...','Connecting to Source...','Processing Media...','Preparing Download...','Ready!'],
  meta:     ['Validating Number...','Connecting to Meta API...','Verifying Business...','Checking Status...','Finalizing...','Done!'],
  chat:     ['Initializing AI...','Processing Input...','Generating Response...','Refining Answer...','Finalizing...','Done!'],
};

function simulateProgress(
  setProgressing: (v: boolean) => void,
  setProgVal: (v: number) => void,
  setProgStep: (v: string) => void,
  steps: string[]
): Promise<void> {
  return new Promise(resolve => {
    setProgressing(true);
    setProgVal(0);
    setProgStep(steps[0]);
    let current = 0;
    let stepIdx = 0;
    const interval = setInterval(() => {
      const inc = Math.random() * 7 + 3;
      current = Math.min(current + inc, 100);
      setProgVal(Math.floor(current));
      const newIdx = Math.min(Math.floor((current / 100) * steps.length), steps.length - 1);
      if (newIdx !== stepIdx) { stepIdx = newIdx; setProgStep(steps[stepIdx]); }
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => { setProgressing(false); resolve(); }, 300);
      }
    }, 280);
  });
}

function ToolProgress({ value, step }: { value: number; step: string }) {
  const steps = PROGRESS_STEPS_GENERIC;
  return (
    <div className="py-6 space-y-4 flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="35" stroke="#1a2a40" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="35" stroke="#00b4ff" strokeWidth="6" fill="none"
            strokeDasharray={219.9} strokeDashoffset={219.9 * (1 - value / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg tabular-nums">{value}%</span>
        </div>
      </div>
      <div className="text-[#00b4ff] font-mono text-sm animate-pulse text-center">{step}</div>
      <div className="w-full space-y-1.5 pt-2">
        {steps.map((s, i) => {
          const threshold = ((i + 1) / steps.length) * 100;
          const done = value >= threshold;
          const active = !done && value >= (i / steps.length) * 100;
          return (
            <div key={i} className={[
              "flex items-center gap-2 text-xs transition-all duration-300",
              done ? "text-green-400" : active ? "text-[#00b4ff]" : "text-gray-600"
            ].join(" ")}>
              <div className={[
                "w-1.5 h-1.5 rounded-full shrink-0",
                done ? "bg-green-400" : active ? "bg-[#00b4ff] animate-pulse" : "bg-gray-700"
              ].join(" ")} />
              {s}
              {done && <span className="ml-auto">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function ToolForm({ toolId }: { toolId: string }) {
  const { toast } = useToast();
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [v3, setV3] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const [progVal, setProgVal] = useState(0);
  const [progStep, setProgStep] = useState('');

  const getSteps = (id: string) => PROGRESS_STEPS_BY_TOOL[id] ?? PROGRESS_STEPS_GENERIC;

  const handleMut = async (mutFn: () => void, steps?: string[]) => {
    setResult(null);
    // Fire mutation immediately, progress runs concurrently
    mutFn();
    await simulateProgress(setProgressing, setProgVal, setProgStep, steps ?? PROGRESS_STEPS_GENERIC);
  };


  const nglSpam = useNglSpam();
  const fakeDana = useFakeDana();
  const phoneLookup = usePhoneLookup();
  const nikCheck = useNikCheck();
  const igStalk = useIgStalk();
  const downloadMedia = useDownloadMedia();
  const chatAi = useChatAi();
  const metaBisnis = useMetaBisnis();

  const ok = (res: any) => { setResult(res); toast({ title: "Berhasil!", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" }); };
  const err = () => toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan, coba lagi." });

  const run = useCallback(async (path: string, body: Record<string, unknown>, stepOverride?: string[]) => {
    setResult(null);
    // Check token before running
    const _token = localStorage.getItem('auth_token');
    if (!_token) {
      toast({ variant: 'destructive', title: 'Belum Login', description: 'Silakan login terlebih dahulu!' });
      return;
    }
    // Fire API call immediately — don't wait for progress animation first
    const apiPromise = callTool(path, body).catch((e: any) => ({ __fetchError: e?.message || "Koneksi gagal" }));
    // Run progress animation concurrently with the API call
    await simulateProgress(setProgressing, setProgVal, setProgStep, stepOverride ?? getSteps(toolId));
    // Now resolve the API result (may already be done)
    setLoading(true);
    try {
      const data = await apiPromise;
      if ((data as any).__fetchError) {
        toast({ variant: "destructive", title: "Error", description: (data as any).__fetchError });
      } else {
        setResult(data);
        if (data?.error === 'Unauthorized' || data?.error === 'Invalid token') {
          toast({ variant: 'destructive', title: '⚠️ Sesi Habis', description: 'Silakan logout dan login ulang.' });
        } else if (data?.success === false || data?.error) {
          toast({ variant: "destructive", title: "Gagal", description: data.error || "Terjadi kesalahan" });
        } else {
          toast({ title: "Berhasil!", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
        }
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Koneksi gagal" });
    } finally {
      setLoading(false);
    }
  }, [toast, toolId]);

  const runGet = useCallback(async (path: string, stepOverride?: string[]) => {
    setResult(null);
    // Fire API call immediately — don't wait for progress animation first
    const apiPromise = callToolGet(path).catch((e: any) => ({ __fetchError: e?.message || "Koneksi gagal" }));
    // Run progress animation concurrently with the API call
    await simulateProgress(setProgressing, setProgVal, setProgStep, stepOverride ?? PROGRESS_STEPS_GENERIC);
    setLoading(true);
    try {
      const data = await apiPromise;
      if ((data as any).__fetchError) {
        toast({ variant: "destructive", title: "Error", description: (data as any).__fetchError });
      } else {
        setResult(data);
        if (!data?.success) toast({ variant: "destructive", title: "Gagal", description: data?.error || "Terjadi kesalahan" });
        else toast({ title: "Berhasil!", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Koneksi gagal" });
    } finally { setLoading(false); }
  }, [toast]);

  if (progressing) return <ToolProgress value={progVal} step={progStep} />;

  // ── NGL Spammer ──
  if (toolId === "ngl") return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 mb-2">CARA PAKAI:</p>
      {["Salin Link NGL target dari Instagram", "Tempel link pada kolom di bawah", "Isi pesan dan jumlah spam", "Klik Start Spam"].map((s, i) => (
        <div key={i} className="flex gap-2 text-xs text-gray-300"><span className="text-[#00b4ff]">✓</span>{s}</div>
      ))}
      <Input placeholder="https://ngl.link/username" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Input placeholder="Pesan rahasia..." value={v2} onChange={e => setV2(e.target.value)} className="cyber-input" />
      <Input placeholder="Jumlah (Max 100)" type="number" value={v3} onChange={e => setV3(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={nglSpam.isPending || progressing}
        onClick={() => handleMut(() => nglSpam.mutate({ data: { targetUrl: v1, message: v2, count: Number(v3) || 10 } }, { onSuccess: ok, onError: err }), getSteps('ngl'))}>
        {nglSpam.isPending ? "Mengirim..." : "🚀 Start Spam"}
      </Button>
      {result && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">{result.message}</div>}
    </div>
  );

  // ── Fake DANA ──
  if (toolId === "dana") return (
    <div className="space-y-4">
      <div className="p-3 bg-[#00b4ff]/10 border border-[#00b4ff]/20 rounded-xl text-xs text-gray-300">
        💡 Generate struk DANA palsu dengan desain realistis
      </div>
      <Input placeholder="Nama Penerima (contoh: Budi Santoso)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Input placeholder="Nominal (contoh: 150000)" type="number" value={v2} onChange={e => setV2(e.target.value)} className="cyber-input" />
      <Input placeholder="Catatan (opsional)" value={v3} onChange={e => setV3(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={fakeDana.isPending || !v1 || !v2 || progressing}
        onClick={() => handleMut(() => fakeDana.mutate({ data: { name: v1, amount: v2 } }, { onSuccess: (_r) => { setResult({ show: true, name: v1, amount: v2, note: v3 }); toast({ title: "Struk dibuat!", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" }); }, onError: err }), getSteps('dana'))}>
        {fakeDana.isPending ? "Generating..." : "Generate Struk DANA"}
      </Button>
      {result?.show && (
        <DanaReceipt
          name={result.name}
          amount={result.amount}
          note={result.note}
          datetime={new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
        />
      )}
    </div>
  );

  // ── Fix Merah ──
  if (toolId === "merah") return (
    <div className="space-y-3">
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <h4 className="text-red-400 font-bold mb-3 text-sm">CARA FIX MERAH WA:</h4>
        {["Pastikan proxy WhatsApp sudah dimatikan", "Clear cache aplikasi WhatsApp", "Restart HP dan buka WhatsApp kembali", "Jika masih merah, ganti nomor ke slot lain", "Tunggu 24 jam, jangan lakukan blast dulu", "Nyalakan proxy setelah 24 jam"].map((s, i) => (
          <div key={i} className="flex gap-2 text-xs text-gray-300 mb-2"><span className="text-red-400 font-bold">{i+1}.</span>{s}</div>
        ))}
      </div>
      <a href={CONFIG.URL_FIX_MERAH} target="_blank" rel="noreferrer">
        <Button className="cyber-button w-full h-12"><ExternalLink className="w-4 h-4 mr-2" />Lihat Tutorial Lengkap</Button>
      </a>
    </div>
  );

  // ── Web Blast ──
  if (toolId === "web") return (
    <div className="space-y-4">
      <div className="p-3 bg-[#00b4ff]/10 border border-[#00b4ff]/20 rounded-xl text-xs text-gray-300">
        💡 Kumpulan link blast tersedia di: <a href={CONFIG.URL_WEB_BLAST} target="_blank" rel="noreferrer" className="text-[#00b4ff] underline">Channel Telegram</a>
      </div>
      <Input placeholder="Target URL / Username" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || progressing}
        onClick={() => run("/tools/web-blast", { target: v1 })}>
        {(loading || progressing) ? "Memproses..." : "🚀 Mulai Web Blast"}
      </Button>
      {result?.success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-sm space-y-2">
          <div className="text-green-400 font-bold">✓ {result.message}</div>
          {result.data && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Total Link</span><span className="text-white">{result.data.total}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Terkirim</span><span className="text-green-400 font-bold">{result.data.sent}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Gagal</span><span className="text-red-400">{result.data.failed}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-[#00b4ff] font-bold uppercase">{result.data.status}</span></div>
            </div>
          )}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── VJ Cent ──
  if (toolId === "vjcent") return (
    <div className="space-y-4">
      <div className="p-4 bg-[#00b4ff]/10 border border-[#00b4ff]/20 rounded-xl text-center">
        <div className="text-[#00b4ff] font-black text-xl mb-1">VJ CENT</div>
        <div className="text-gray-300 text-xs mb-3">Platform premium tools & layanan eksklusif</div>
        <a href={CONFIG.URL_VJ_CENT} target="_blank" rel="noreferrer">
          <Button className="cyber-button w-full h-11"><ExternalLink className="w-4 h-4 mr-2" /> Kunjungi VJ Cent</Button>
        </a>
      </div>
      <div className="p-4 bg-black/40 border border-[#00b4ff]/20 rounded-xl space-y-2">
        <div className="text-white font-bold text-sm mb-2">Benefit Member VJ Cent:</div>
        {["Akses semua tools premium", "Update tools terbaru", "Support 24/7 via Telegram", "Harga reseller spesial", "Bonus tools eksklusif"].map((b, i) => (
          <div key={i} className="flex gap-2 text-xs text-gray-300"><span className="text-[#00b4ff]">✓</span>{b}</div>
        ))}
      </div>
    </div>
  );

  // ── Meta Bisnis ──
  if (toolId === "meta") return (
    <div className="space-y-4">
      <Input placeholder="Nomor WA Bisnis (628...)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={metaBisnis.isPending || progressing}
        onClick={() => handleMut(() => metaBisnis.mutate({ data: { phone: v1 } }, { onSuccess: ok, onError: err }), getSteps('meta'))}>
        {metaBisnis.isPending ? "Memverifikasi..." : "Verifikasi WA Bisnis"}
      </Button>
      {result && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl space-y-2 text-sm">
          <div className="text-green-400 font-bold">✓ {result.message}</div>
        </div>
      )}
    </div>
  );

  // ── NIK Check ──
  if (toolId === "nik") return (
    <div className="space-y-4">
      <Input placeholder="NIK KTP (16 digit)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input font-mono" maxLength={16} />
      <Button className="cyber-button w-full h-12" disabled={nikCheck.isPending || progressing}
        onClick={() => handleMut(() => nikCheck.mutate({ data: { nik: v1 } }, { onSuccess: ok, onError: err }), getSteps('nik'))}>
        {nikCheck.isPending ? "Memeriksa..." : "Cek Data KTP"}
      </Button>
      {result?.data && (
        <div className="p-4 bg-black border border-[#00b4ff]/40 rounded-xl text-sm space-y-2">
          <div className="text-[#00b4ff] font-bold text-center mb-3">DATA KEPENDUDUKAN</div>
          <ResultCard data={result.data} />
        </div>
      )}
    </div>
  );

  // ── Phone Lookup ──
  if (toolId === "phone") return (
    <div className="space-y-4">
      <Input placeholder="Nomor Telepon (628...)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input font-mono" />
      <Button className="cyber-button w-full h-12" disabled={phoneLookup.isPending || progressing}
        onClick={() => handleMut(() => phoneLookup.mutate({ data: { phone: v1 } }, { onSuccess: ok, onError: err }), getSteps('phone'))}>
        {phoneLookup.isPending ? "Memeriksa..." : "Cek Nomor Sekarang"}
      </Button>
      {result?.success && (
        <div className="p-4 bg-black border border-[#00b4ff]/40 rounded-xl text-sm space-y-2">
          <div className="text-[#00b4ff] font-bold text-center mb-3">INFO NOMOR</div>
          {[["Nomor", result.phone], ["Operator", result.operator], ["Region", result.region], ["Valid", result.isValid ? "✓ Valid" : "✗ Invalid"]].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="text-white">{v}</span></div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Buy Nokos ──
  if (toolId === "nokos_buy") return (
    <div className="space-y-4">
      <div className="p-4 bg-[#00b4ff]/10 border border-[#00b4ff]/20 rounded-xl text-center">
        <div className="text-[#00b4ff] font-black text-xl mb-1">NOKOS</div>
        <div className="text-gray-300 text-xs mb-3">Platform jual beli Nokos terpercaya</div>
        <a href={CONFIG.URL_NOKOS} target="_blank" rel="noreferrer">
          <Button className="cyber-button w-full h-11"><ExternalLink className="w-4 h-4 mr-2" /> Beli Nokos Sekarang</Button>
        </a>
      </div>
    </div>
  );

  // ── Gacha Nokos ──
  if (toolId === "nokos_gch") return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
        <div className="text-purple-400 font-black text-2xl mb-1">🎲 GACHA</div>
        <div className="text-gray-300 text-xs mb-3">Coba keberuntunganmu!</div>
        <a href={CONFIG.URL_GACHA_NOKOS} target="_blank" rel="noreferrer">
          <Button className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-full">
            🎰 Mulai Gacha
          </Button>
        </a>
      </div>
    </div>
  );

  // ── Uncheck/Jasteb ──
  if (toolId === "uncheck") return (
    <div className="space-y-4">
      <div className="p-3 bg-[#00b4ff]/10 border border-[#00b4ff]/20 rounded-xl text-xs text-gray-300">
        💡 Panel Uncheck digunakan untuk menghapus centang biru / tanda read pada WA target.
      </div>
      <Input placeholder="Nomor WA Target (628...)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input font-mono" />
      <Button className="cyber-button w-full h-12" disabled={loading || progressing}
        onClick={() => run("/tools/uncheck-jasteb", { phone: v1 }, ['Validating Number...','Connecting Panel...','Accessing Jasteb...','Sending Uncheck...','Verifying Status...','Done!'])}>
        {(loading || progressing) ? "Memproses..." : "✅ Panel Uncheck"}
      </Button>
      {result?.success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-sm space-y-2">
          <div className="text-green-400 font-bold">✓ {result.message}</div>
          {result.data && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Nomor</span><span className="text-white font-mono">{result.data.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Panel</span><span className="text-[#00b4ff]">{result.data.panel}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-green-400 font-bold">{result.data.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Timestamp</span><span className="text-white font-mono">{result.data.timestamp}</span></div>
            </div>
          )}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Chat AI ──
  if (toolId === "chat") return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="min-h-[200px] max-h-[300px] overflow-y-auto bg-black/50 border border-[#00b4ff]/20 rounded-xl p-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {chatHistory.length === 0 && <div className="text-center text-gray-500 text-sm mt-8">Tanyakan apa saja ke AI Assistant...</div>}
        {chatHistory.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === "user" ? "bg-[#00b4ff] text-white rounded-br-sm" : "bg-[#1a2040] text-gray-200 rounded-bl-sm border border-[#00b4ff]/20"}`}>{m.text}</div>
          </div>
        ))}
        {chatAi.isPending && <div className="flex justify-start"><div className="bg-[#1a2040] border border-[#00b4ff]/20 p-3 rounded-2xl rounded-bl-sm text-sm text-gray-400 animate-pulse">Sedang mengetik...</div></div>}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Tulis pesan..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input flex-1"
          onKeyDown={e => { if (e.key === "Enter" && v1.trim()) { const msg = v1; setV1(""); setChatHistory(h => [...h, { role: "user", text: msg }]); chatAi.mutate({ data: { message: msg } }, { onSuccess: (r) => setChatHistory(h => [...h, { role: "ai", text: r.message }]), onError: () => setChatHistory(h => [...h, { role: "ai", text: "Maaf, terjadi kesalahan." }]) }); } }} />
        <Button className="cyber-button w-16" disabled={chatAi.isPending || !v1.trim()}
          onClick={() => { const msg = v1; setV1(""); setChatHistory(h => [...h, { role: "user", text: msg }]); chatAi.mutate({ data: { message: msg } }, { onSuccess: (r) => setChatHistory(h => [...h, { role: "ai", text: r.message }]), onError: () => setChatHistory(h => [...h, { role: "ai", text: "Maaf, terjadi kesalahan." }]) }); }}>
          Kirim
        </Button>
      </div>
    </div>
  );

  // ── Downloader (semua platform) ──
  if (toolId === "download") return (
    <div className="space-y-4">
      <div className="p-3 bg-[#00b4ff]/10 border border-[#00b4ff]/20 rounded-xl text-xs text-gray-300 space-y-1">
        <p className="font-bold text-[#00b4ff]">Platform yang didukung:</p>
        <p>TikTok • Instagram • YouTube • Twitter/X • Facebook • Spotify • Capcut • SoundCloud • Douyin</p>
      </div>
      <Input placeholder="Paste URL di sini..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={downloadMedia.isPending || progressing}
        onClick={() => handleMut(() => downloadMedia.mutate({ data: { url: v1 } }, { onSuccess: ok, onError: err }), getSteps('download'))}>
        {downloadMedia.isPending ? "Mengunduh..." : "⬇️ Download Sekarang"}
      </Button>
      {result?.success && (
        <div className="p-4 bg-black border border-[#00b4ff]/40 rounded-xl space-y-3">
          {result.thumbnail && <img src={result.thumbnail} alt="thumb" className="w-full rounded-lg max-h-40 object-cover" />}
          <div className="text-white font-medium text-sm">{result.title || "Media Downloaded"}</div>
          <div className="flex justify-between text-xs"><span className="text-gray-400">Platform</span><span className="text-[#00b4ff] capitalize">{result.platform}</span></div>
          {result.downloadUrl && (
            <a href={result.downloadUrl} target="_blank" rel="noreferrer" download>
              <Button className="cyber-button w-full h-11 mt-2"><Download className="w-4 h-4 mr-2" />Download File</Button>
            </a>
          )}
        </div>
      )}
      {result?.success === false && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>
      )}
    </div>
  );

  // ── Stalk Instagram ──
  if (toolId === "ig") return (
    <div className="space-y-4">
      <Input placeholder="@username" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={igStalk.isPending || progressing}
        onClick={() => handleMut(() => igStalk.mutate({ data: { username: v1.replace("@", "") } }, { onSuccess: ok, onError: err }), getSteps('ig'))}>
        {igStalk.isPending ? "Stalking..." : "🔍 Stalk Sekarang"}
      </Button>
      {result?.success && (
        <div className="p-4 bg-black border border-pink-500/40 rounded-xl flex flex-col items-center">
          {result.profilePic ? <img src={result.profilePic} alt="profile" className="w-20 h-20 rounded-full mb-3 border-2 border-pink-500 object-cover" /> : <div className="w-20 h-20 rounded-full mb-3 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">{result.username?.substring(0, 2).toUpperCase()}</div>}
          <div className="font-bold text-white text-lg">{result.fullName || "N/A"}</div>
          <div className="text-pink-400 mb-1">@{result.username}</div>
          {result.isPrivate && <div className="text-xs text-gray-400 mb-2">🔒 Akun Privat</div>}
          {result.bio && <div className="text-center text-gray-300 text-xs mb-3">{result.bio}</div>}
          <div className="grid grid-cols-3 w-full text-center border-t border-pink-500/20 pt-3">
            {[["Posts", result.posts], ["Followers", result.followers?.toLocaleString()], ["Following", result.following?.toLocaleString()]].map(([k, v]) => (
              <div key={String(k)}><div className="font-bold text-white">{v ?? "?"}</div><div className="text-xs text-gray-500">{k}</div></div>
            ))}
          </div>
        </div>
      )}
      {result?.success === false && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error || "Akun tidak ditemukan."}</div>}
    </div>
  );

  // ── Stalk TikTok ──
  if (toolId === "stk-tiktok") return (
    <div className="space-y-4">
      <Input placeholder="@username TikTok" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-tiktok", { username: v1.replace("@","") })}>
        {loading ? "Stalking..." : "🔍 Stalk TikTok"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Stalk Threads ──
  if (toolId === "stk-threads") return (
    <div className="space-y-4">
      <Input placeholder="@username Threads" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-threads", { username: v1.replace("@","") })}>
        {loading ? "Stalking..." : "🔍 Stalk Threads"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Stalk GitHub ──
  if (toolId === "stk-github") return (
    <div className="space-y-4">
      <Input placeholder="username GitHub" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-github", { username: v1 })}>
        {loading ? "Stalking..." : "🔍 Stalk GitHub"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-black border border-gray-700 rounded-xl flex flex-col items-center gap-3">
          {result.data.avatar && <img src={result.data.avatar} alt="avatar" className="w-20 h-20 rounded-full border-2 border-gray-500" />}
          <div className="font-bold text-white text-lg">{result.data.fullName || result.data.username}</div>
          <div className="text-gray-400 text-sm">@{result.data.username}</div>
          {result.data.bio && <div className="text-center text-gray-300 text-xs">{result.data.bio}</div>}
          <div className="grid grid-cols-3 w-full text-center border-t border-gray-700 pt-3">
            {[["Repos", result.data.repos], ["Followers", result.data.followers], ["Following", result.data.following]].map(([k, v]) => (
              <div key={String(k)}><div className="font-bold text-white">{v ?? "?"}</div><div className="text-xs text-gray-500">{k}</div></div>
            ))}
          </div>
          {result.data.location && <div className="text-xs text-gray-400">📍 {result.data.location}</div>}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Stalk Roblox ──
  if (toolId === "stk-roblox") return (
    <div className="space-y-4">
      <Input placeholder="Username Roblox" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-roblox", { username: v1 })}>
        {loading ? "Stalking..." : "🔍 Stalk Roblox"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Stalk Pinterest ──
  if (toolId === "stk-pinterest") return (
    <div className="space-y-4">
      <Input placeholder="username Pinterest" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-pinterest", { username: v1 })}>
        {loading ? "Stalking..." : "🔍 Stalk Pinterest"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Stalk Twitter/X ──
  if (toolId === "stk-twitter") return (
    <div className="space-y-4">
      <Input placeholder="@username Twitter/X" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-twitter", { username: v1.replace("@","") })}>
        {loading ? "Stalking..." : "🔍 Stalk Twitter/X"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Stalk YouTube ──
  if (toolId === "stk-youtube") return (
    <div className="space-y-4">
      <Input placeholder="Channel name / @handle" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/stalk-youtube", { username: v1 })}>
        {loading ? "Stalking..." : "🔍 Stalk YouTube"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Screenshot Website ──
  if (toolId === "screenshot") return (
    <div className="space-y-4">
      <Input placeholder="https://contoh.com" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/screenshot", { url: v1 })}>
        {loading ? "Mengambil screenshot..." : "📸 Screenshot"}
      </Button>
      {result?.success && result.imageUrl && <ImageResult url={result.imageUrl} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Translate ──
  if (toolId === "translate") return (
    <div className="space-y-4">
      <Textarea placeholder="Teks yang ingin diterjemahkan..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input min-h-[100px]" />
      <Select value={v2 || "id"} onValueChange={setV2}>
        <SelectTrigger className="cyber-input w-full"><SelectValue placeholder="Bahasa tujuan" /></SelectTrigger>
        <SelectContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white">
          {[["id","Indonesia"],["en","English"],["ja","日本語"],["ko","한국어"],["zh","中文"],["ar","العربية"],["fr","Français"],["de","Deutsch"],["es","Español"],["pt","Português"]].map(([v,l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/translate", { text: v1, lang: v2 || "id" })}>
        {loading ? "Menerjemahkan..." : "🌐 Terjemahkan"}
      </Button>
      {result?.success && result.result && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl">
          <div className="text-xs text-gray-400 mb-2">Hasil Terjemahan:</div>
          <div className="text-white text-sm">{result.result}</div>
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── QR Generator ──
  if (toolId === "qr") return (
    <div className="space-y-4">
      <Input placeholder="Teks atau URL..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => {
        setResult({ success: true, url: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(v1)}` });
      }}>
        {loading ? "Membuat..." : "🔳 Generate QR Code"}
      </Button>
      {result?.success && result.url && (
        <div className="p-4 bg-white border border-[#00b4ff]/30 rounded-xl text-center">
          <img src={result.url} alt="QR Code" className="w-48 h-48 mx-auto" />
          <a href={result.url} target="_blank" rel="noreferrer" download="qr_code.png">
            <Button className="mt-4 w-full bg-[#00b4ff] hover:bg-[#00b4ff]/80 text-white">
              <Download className="w-4 h-4 mr-2" /> Download QR
            </Button>
          </a>
        </div>
      )}
    </div>
  );

  // ── Kode Pos ──
  if (toolId === "kodepos") return (
    <div className="space-y-4">
      <Input placeholder="Masukkan kode pos atau nama kota" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/kodepos", { query: v1 })}>
        {loading ? "Mencari..." : "🔍 Cari Kode Pos"}
      </Button>
      {result?.success && result.data && (Array.isArray(result.data) ? (
        <div className="space-y-2">
          {result.data.slice(0, 10).map((d: any, i: number) => <ResultCard key={i} data={d} />)}
        </div>
      ) : <ResultCard data={result.data} />)}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Country Info ──
  if (toolId === "country") return (
    <div className="space-y-4">
      <Input placeholder="Nama negara (contoh: Indonesia)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/country-info", { name: v1 })}>
        {loading ? "Mencari..." : "🌍 Cari Info Negara"}
      </Button>
      {result?.success && result.data && <ResultCard data={Array.isArray(result.data) ? result.data[0] : result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Subdomain Finder ──
  if (toolId === "subdomain") return (
    <div className="space-y-4">
      <Input placeholder="contoh.com" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input font-mono" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/subdomain-finder", { domain: v1 })}>
        {loading ? "Mencari subdomain..." : "🔍 Cari Subdomain"}
      </Button>
      {result?.success && Array.isArray(result.data) && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-1 max-h-60 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2">Ditemukan {result.data.length} subdomain:</div>
          {result.data.map((s: string, i: number) => (
            <div key={i} className="text-[#00b4ff] font-mono text-xs">{s}</div>
          ))}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── VCC Generator ──
  if (toolId === "vcc") return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-gray-300">
        ⚠️ Hanya untuk keperluan testing. Jangan digunakan untuk transaksi nyata.
      </div>
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/vcc-generator", {})}>
        {loading ? "Generating..." : "💳 Generate VCC"}
      </Button>
      {result?.success && result.data && (
        <div className="p-5 bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-500/40 rounded-2xl space-y-3">
          <div className="text-amber-400 font-bold text-center">{result.data.type || "VISA"}</div>
          <div className="font-mono text-white text-lg tracking-widest text-center">{result.data.cc}</div>
          <div className="flex justify-between text-sm">
            <div><div className="text-gray-400 text-xs">EXPIRED</div><div className="text-white font-mono">{result.data.exp}</div></div>
            <div><div className="text-gray-400 text-xs">CVV</div><div className="text-white font-mono">{result.data.cvv}</div></div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Search tools (Pinterest, Google Image, YouTube, SoundCloud, DDG, Bing Image) ──
  const searchConfig: Record<string, { path: string; placeholder: string; label: string; type: "images" | "list" }> = {
    pinterestsearch: { path: "/tools/pinterest-search", placeholder: "Cari di Pinterest...", label: "Pinterest Search", type: "images" },
    googleimage:     { path: "/tools/google-image",     placeholder: "Cari gambar...",        label: "Google Image",    type: "images" },
    ytsearch:        { path: "/tools/youtube-search",   placeholder: "Cari video YouTube...", label: "YouTube Search",  type: "list" },
    scsearch:        { path: "/tools/soundcloud-search",placeholder: "Cari lagu SoundCloud...",label:"SoundCloud Search",type: "list" },
    ddgsearch:       { path: "/tools/ddg-search",       placeholder: "Cari apapun...",        label: "DuckDuckGo",      type: "list" },
    bingimage:       { path: "/tools/bing-image",       placeholder: "Cari gambar Bing...",   label: "Bing Image",      type: "images" },
  };
  if (searchConfig[toolId]) {
    const sc = searchConfig[toolId];
    return (
      <div className="space-y-4">
        <Input placeholder={sc.placeholder} value={v1} onChange={e => setV1(e.target.value)} className="cyber-input"
          onKeyDown={e => { if (e.key === "Enter" && v1.trim()) run(sc.path, { query: v1 }); }} />
        <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run(sc.path, { query: v1 })}>
          {loading ? "Mencari..." : `🔍 Cari`}
        </Button>
        {result?.success && Array.isArray(result.data) && (
          sc.type === "images" ? (
            <ImageGrid items={result.data.map((d: any) => typeof d === "string" ? d : d?.url || d?.image || d?.thumbnail).filter(Boolean)} />
          ) : (
            <div className="space-y-2">
              {result.data.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="p-3 bg-black/60 border border-[#00b4ff]/20 rounded-xl">
                  <div className="text-white text-sm font-medium">{item.title || item.name || "—"}</div>
                  {(item.url || item.link) && <a href={item.url || item.link} target="_blank" rel="noreferrer" className="text-[#00b4ff] text-xs underline break-all">{item.url || item.link}</a>}
                  {item.description && <div className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</div>}
                </div>
              ))}
            </div>
          )
        )}
        {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
      </div>
    );
  }

  // ── KBBI ──
  if (toolId === "kbbi") return (
    <div className="space-y-4">
      <Input placeholder="Masukkan kata (contoh: berani)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/kbbi", { word: v1 })}>
        {loading ? "Mencari..." : "📖 Cari di KBBI"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-2">
          <div className="text-[#00b4ff] font-bold text-lg">{result.data.word || v1}</div>
          {result.data.meanings && result.data.meanings.map((m: any, i: number) => (
            <div key={i} className="text-gray-300 text-sm border-l-2 border-[#00b4ff]/40 pl-3">
              <span className="text-gray-400 italic text-xs">{m.class}</span>
              <div>{m.definition}</div>
            </div>
          ))}
          {typeof result.data === "string" && <div className="text-gray-300 text-sm">{result.data}</div>}
          {typeof result.data === "object" && !result.data.meanings && <ResultCard data={result.data} />}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Cuaca ──
  if (toolId === "cuaca") return (
    <div className="space-y-4">
      <Input placeholder="Nama kota/wilayah (contoh: Jakarta)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/cuaca", { wilayah: v1 })}>
        {loading ? "Mengambil data..." : "🌤 Cek Cuaca"}
      </Button>
      {result?.success && result.data && <ResultCard data={Array.isArray(result.data) ? result.data[0] : result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Event Indonesia ──
  if (toolId === "eventid") return (
    <div className="space-y-4">
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => runGet("/tools/event-indonesia")}>
        {loading ? "Mengambil data..." : "🎉 Lihat Event Indonesia"}
      </Button>
      {result?.success && Array.isArray(result.data) && (
        <div className="space-y-2">
          {result.data.slice(0, 10).map((ev: any, i: number) => (
            <div key={i} className="p-3 bg-black/60 border border-[#00b4ff]/20 rounded-xl">
              <div className="text-white text-sm font-medium">{ev.name || ev.title || "Event"}</div>
              {ev.date && <div className="text-gray-400 text-xs mt-1">📅 {ev.date}</div>}
              {ev.location && <div className="text-gray-400 text-xs">📍 {ev.location}</div>}
            </div>
          ))}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Jadwal TV ──
  if (toolId === "jadwaltv") return (
    <div className="space-y-4">
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => runGet("/tools/jadwal-tv")}>
        {loading ? "Mengambil data..." : "📺 Lihat Jadwal TV"}
      </Button>
      {result?.success && Array.isArray(result.data) && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {result.data.slice(0, 20).map((prog: any, i: number) => (
            <div key={i} className="p-3 bg-black/60 border border-[#00b4ff]/20 rounded-xl">
              <div className="text-[#00b4ff] font-bold text-xs">{prog.channel || prog.stasiun}</div>
              <div className="text-white text-sm">{prog.title || prog.program}</div>
              {prog.time && <div className="text-gray-400 text-xs">⏰ {prog.time}</div>}
            </div>
          ))}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── BMKG Gempa ──
  if (toolId === "bmkg") return (
    <div className="space-y-4">
      <Button className="cyber-button w-full h-12 bg-orange-600 hover:bg-orange-700" disabled={loading} onClick={() => runGet("/tools/bmkg-gempa")}>
        {loading ? "Mengambil data..." : "⚠️ Cek Gempa Terbaru"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-orange-900/20 border border-orange-500/40 rounded-xl space-y-2">
          <div className="text-orange-400 font-bold text-center mb-2">DATA GEMPA BMKG</div>
          <ResultCard data={Array.isArray(result.data) ? result.data[0] : result.data} />
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── TextPro / PhotoOxy / Ephoto360 (image effect generators) ──
  const effectConfig: Record<string, { path: string; effectOptions: string[]; label: string }> = {
    textpro:  { path: "/tools/textpro",  label: "TextPro", effectOptions: ["neon","fire","glitch","gold","ice","galaxy","smoke","matrix","rainbow","retro"] },
    photooxy: { path: "/tools/photooxy", label: "PhotoOxy",effectOptions: ["love","birthday","nature","frame","vintage","polaroid","shadow","mirror"] },
    ephoto360:{ path: "/tools/ephoto360",label: "Ephoto360",effectOptions: ["birthday","love","neon","christmas","halloween","fire","water","earth"] },
  };
  if (effectConfig[toolId]) {
    const ec = effectConfig[toolId];
    return (
      <div className="space-y-4">
        <Input placeholder="Masukkan teks..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
        <Select value={v2 || ec.effectOptions[0]} onValueChange={setV2}>
          <SelectTrigger className="cyber-input w-full"><SelectValue placeholder="Pilih efek" /></SelectTrigger>
          <SelectContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white">
            {ec.effectOptions.map(eff => <SelectItem key={eff} value={eff}>{eff.charAt(0).toUpperCase() + eff.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run(ec.path, { text: v1, effect: v2 || ec.effectOptions[0] })}>
          {loading ? "Membuat..." : `✨ Generate ${ec.label}`}
        </Button>
        {result?.success && result.imageUrl && <ImageResult url={result.imageUrl} />}
        {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
      </div>
    );
  }

  // ── Brat Generator ──
  if (toolId === "brat") return (
    <div className="space-y-4">
      <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-xl text-xs text-gray-300">
        💡 Generate gambar Brat style dengan teksmu
      </div>
      <Input placeholder="Masukkan teks brat..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading} onClick={() => run("/tools/brat", { text: v1 })}>
        {loading ? "Generating..." : "⚡ Generate Brat"}
      </Button>
      {result?.success && result.imageUrl && <ImageResult url={result.imageUrl} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );


  // ═══════════════════ IKYYXD TOOLS ═══════════════════════

  // Helper proxy ke backend ikyyxd
  const runIky = async (endpoint: string, params: Record<string, string>, steps?: string[]) => {
    setResult(null);
    const token = localStorage.getItem("auth_token");
    const apiPromise = fetch("/api/tools/ikyyxd", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ endpoint, params }),
    }).then(r => r.json()).catch((e: any) => ({ success: false, error: e?.message || "Koneksi gagal" }));
    await simulateProgress(setProgressing, setProgVal, setProgStep, steps ?? PROGRESS_STEPS_GENERIC);
    setLoading(true);
    try {
      const data = await apiPromise;
      setResult(data);
      if (!data?.success) toast({ variant: "destructive", title: "Gagal", description: data?.error || "Terjadi kesalahan" });
      else toast({ title: "Berhasil!", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
    } catch { toast({ variant: "destructive", title: "Error", description: "Koneksi gagal" }); }
    finally { setLoading(false); }
  };

  if (toolId === "iky-tiktok-dl") return (
    <div className="space-y-4">
      <div className="p-3 bg-black/60 border border-gray-500/30 rounded-xl text-xs text-gray-300">📱 Download video TikTok tanpa watermark</div>
      <Input placeholder="https://tiktok.com/@user/video/..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/download/tiktokv4", { url: v1 })}>
        {loading ? "Mendownload..." : "⬇️ Download TikTok"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-3">
          {result.data.result?.thumbnail && <img src={result.data.result.thumbnail} alt="thumb" className="w-full rounded-xl max-h-48 object-cover" />}
          <div className="text-white text-sm font-bold">{result.data.result?.title || "TikTok Video"}</div>
          {result.data.result?.video && (
            <a href={result.data.result.video} target="_blank" rel="noreferrer" download>
              <Button className="cyber-button w-full h-10 text-sm"><Download className="w-4 h-4 mr-2" />Download Video</Button>
            </a>
          )}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-yt-mp3") return (
    <div className="space-y-4">
      <Input placeholder="URL YouTube (https://youtube.com/watch?v=...)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/download/ytmp3", { url: v1 })}>
        {loading ? "Mendownload..." : "🎵 Download MP3"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-2">
          <div className="text-white font-bold text-sm">{result.data.result?.title || "Audio"}</div>
          {result.data.result?.AudioUrl?.url && (
            <a href={result.data.result.AudioUrl.url} target="_blank" rel="noreferrer" download>
              <Button className="cyber-button w-full h-10 text-sm"><Download className="w-4 h-4 mr-2" />Download MP3</Button>
            </a>
          )}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-yt-mp4") return (
    <div className="space-y-4">
      <Input placeholder="Judul / keyword YouTube..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/download/ytmp4", { q: v1 })}>
        {loading ? "Mencari..." : "🎬 Download MP4"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-3">
          {result.data.result.thumbnail && <img src={result.data.result.thumbnail} alt="thumb" className="w-full rounded-xl max-h-40 object-cover" />}
          <div className="text-white font-bold text-sm">{result.data.result.title}</div>
          {result.data.result.VideoUrl?.url && (
            <a href={result.data.result.VideoUrl.url} target="_blank" rel="noreferrer" download>
              <Button className="cyber-button w-full h-10 text-sm"><Download className="w-4 h-4 mr-2" />Download MP4</Button>
            </a>
          )}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-yt-play") return (
    <div className="space-y-4">
      <Input placeholder="Judul / keyword YouTube..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/search/ytplay", { q: v1 })}>
        {loading ? "Mencari..." : "▶️ Play YouTube Audio"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-3">
          {result.data.result.thumbnail && <img src={result.data.result.thumbnail} alt="thumb" className="w-full rounded-xl max-h-40 object-cover" />}
          <div className="text-white font-bold text-sm">{result.data.result.title}</div>
          {result.data.result.audio?.url && <audio controls className="w-full" src={result.data.result.audio.url}><track kind="captions" /></audio>}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-ig-dl") return (
    <div className="space-y-4">
      <Input placeholder="URL Instagram post/reel..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/download/igall", { url: v1 })}>
        {loading ? "Mendownload..." : "📷 Download Instagram"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="p-4 bg-black/60 border border-pink-500/30 rounded-xl space-y-2">
          <div className="text-white font-bold text-sm">{result.data.result.title || "Media Instagram"}</div>
          {Array.isArray(result.data.result.media) && result.data.result.media.map((m: any, i: number) => (
            <a key={i} href={m.url} target="_blank" rel="noreferrer" download>
              <Button className="cyber-button w-full h-9 text-xs mb-1"><Download className="w-3 h-3 mr-1" />Download Media {i + 1}</Button>
            </a>
          ))}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-gpt") return (
    <div className="space-y-3">
      <div className="min-h-[180px] max-h-[280px] overflow-y-auto bg-black/50 border border-[#00b4ff]/20 rounded-xl p-3 space-y-2" style={{ scrollbarWidth: "none" }}>
        {!result && <div className="text-center text-gray-500 text-sm mt-8">GPT-5 Mini siap membantu...</div>}
        {result?.success && result.data?.result && (
          <div className="bg-[#1a2040] border border-[#00b4ff]/20 p-3 rounded-xl text-sm text-gray-200">{result.data.result}</div>
        )}
        {loading && <div className="bg-[#1a2040] border border-[#00b4ff]/20 p-3 rounded-xl text-sm text-gray-400 animate-pulse">GPT mengetik...</div>}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Tulis pertanyaan..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input flex-1"
          onKeyDown={e => { if (e.key === "Enter" && v1.trim() && !loading) { const q = v1; setV1(""); runIky("/ai/gpt-5-mini", { question: q }); } }} />
        <Button className="cyber-button w-16 text-xs" disabled={loading || !v1.trim()}
          onClick={() => { const q = v1; setV1(""); runIky("/ai/gpt-5-mini", { question: q }); }}>Kirim</Button>
      </div>
    </div>
  );

  if (toolId === "iky-txt2vid") return (
    <div className="space-y-4">
      <Textarea placeholder="Deskripsikan video yang ingin dibuat..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input min-h-[100px]" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/ai/GrokVideo", { prompt: v1 })}>
        {loading ? "Generating..." : "🎬 Generate Video"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl space-y-2">
          {result.data.result.videoUrl && (
            <a href={result.data.result.videoUrl} target="_blank" rel="noreferrer" download>
              <Button className="cyber-button w-full h-10 text-sm"><Download className="w-4 h-4 mr-2" />Download Video</Button>
            </a>
          )}
          <div className="text-gray-400 text-xs break-all">{JSON.stringify(result.data.result)}</div>
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-osint-ip") return (
    <div className="space-y-4">
      <Input placeholder="IP Address (contoh: 8.8.8.8)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input font-mono" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/osint/ip", { ip: v1 })}>
        {loading ? "Melacak..." : "🌐 Lacak IP"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data.result || result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-cek-web") return (
    <div className="space-y-4">
      <Input placeholder="domain.com" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input font-mono" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/tools/chekweb", { host: v1 })}>
        {loading ? "Mengecek..." : "🔍 Cek Website"}
      </Button>
      {result?.success && result.data && <ResultCard data={result.data.result || result.data} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-shortlink") return (
    <div className="space-y-4">
      <Input placeholder="https://url-panjang.com/..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/tools/shortlink", { url: v1 })}>
        {loading ? "Mempersingkat..." : "🔗 Short Link"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-black/60 border border-[#00b4ff]/30 rounded-xl">
          <div className="text-gray-400 text-xs mb-1">Link pendek:</div>
          <div className="text-[#00b4ff] font-mono break-all">{result.data.result?.shorturl || result.data.shorturl || JSON.stringify(result.data.result || result.data)}</div>
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-ssweb") return (
    <div className="space-y-4">
      <Input placeholder="https://website.com" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/tools/ssweb", { url: v1 })}>
        {loading ? "Screenshot..." : "📸 Screenshot Web"}
      </Button>
      {result?.success && (result.data?.result || result.data?.url) && <ImageResult url={result.data.result || result.data.url} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-fix-error") return (
    <div className="space-y-4">
      <Textarea placeholder="Paste kode error / bug di sini..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input min-h-[120px] font-mono" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/tools/fixerror", { code: v1 })}>
        {loading ? "Menganalisa..." : "🔧 Fix Error"}
      </Button>
      {result?.success && result.data && (
        <div className="p-4 bg-black/60 border border-green-500/30 rounded-xl">
          <div className="text-green-400 text-xs mb-2 font-bold">Solusi:</div>
          <div className="text-gray-200 text-sm whitespace-pre-wrap">{result.data.result || result.data.message || JSON.stringify(result.data)}</div>
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-remini") return (
    <div className="space-y-4">
      <Input placeholder="URL gambar buram..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/tools/remini", { url: v1 })}>
        {loading ? "Memproses..." : "✨ Perjelas Foto"}
      </Button>
      {result?.success && (result.data?.result || result.data?.url) && <ImageResult url={result.data.result || result.data.url} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-logo") return (
    <div className="space-y-4">
      <Input placeholder="Teks untuk logo..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/image/logo", { text: v1 })}>
        {loading ? "Generating..." : "🎨 Generate Logo"}
      </Button>
      {result?.success && (result.data?.result || result.data?.url) && <ImageResult url={result.data.result || result.data.url} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-anime2real") return (
    <div className="space-y-4">
      <Input placeholder="URL gambar anime..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/edit/anime2real", { url: v1 })}>
        {loading ? "Mengkonversi..." : "🎭 Anime to Real"}
      </Button>
      {result?.success && (result.data?.result || result.data?.url) && <ImageResult url={result.data.result || result.data.url} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-faceswap") return (
    <div className="space-y-4">
      <Input placeholder="URL wajah 1 (sumber)..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Input placeholder="URL wajah 2 (target)..." value={v2} onChange={e => setV2(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1 || !v2} onClick={() => runIky("/edit/faceswap", { url1: v1, url2: v2 })}>
        {loading ? "Swapping..." : "🔄 Face Swap"}
      </Button>
      {result?.success && (result.data?.result || result.data?.url) && <ImageResult url={result.data.result || result.data.url} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-kisah-nabi") return (
    <div className="space-y-4">
      <Select value={v1 || "muhammad"} onValueChange={setV1}>
        <SelectTrigger className="cyber-input w-full"><SelectValue placeholder="Pilih Nabi" /></SelectTrigger>
        <SelectContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white">
          {["adam","nuh","ibrahim","musa","muhammad","isa"].map(n => (
            <SelectItem key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="cyber-button w-full h-12" onClick={() => runIky("/islamic/kisahnabi", { nabi: v1 || "muhammad" })}>
        {loading ? "Memuat..." : "📖 Baca Kisah"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="p-4 bg-black/60 border border-emerald-500/30 rounded-xl text-gray-200 text-sm leading-relaxed max-h-80 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {result.data.result}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-country") return (
    <div className="space-y-4">
      <Input placeholder="Nama negara (contoh: Indonesia, Japan...)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/info/country", { q: v1 })}>
        {loading ? "Mencari..." : "🌍 Cari Info Negara"}
      </Button>
      {result?.success && result.data && <ResultCard data={Array.isArray(result.data.result) ? result.data.result[0] : (result.data.result || result.data)} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-jadwal-tv") return (
    <div className="space-y-4">
      <Input placeholder="Nama channel (contoh: SCTV, RCTI...)" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/info/jadwaltv", { channel: v1 })}>
        {loading ? "Mengambil..." : "📺 Lihat Jadwal TV"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {(Array.isArray(result.data.result) ? result.data.result : [result.data.result]).map((item: any, i: number) => (
            <div key={i} className="p-3 bg-black/60 border border-indigo-500/30 rounded-xl">
              <div className="text-white font-bold text-sm">{item.title || item.program}</div>
              <div className="text-gray-400 text-xs">{item.time || item.jam}</div>
            </div>
          ))}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-fake-wa") return (
    <div className="space-y-4">
      <Input placeholder="Nama" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Input placeholder="Bio" value={v2} onChange={e => setV2(e.target.value)} className="cyber-input" />
      <Input placeholder="Nomor (0812...)" value={v3} onChange={e => setV3(e.target.value)} className="cyber-input font-mono" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/canvas/fakewa", { nama: v1, bio: v2, nomor: v3, url_pp: "" })}>
        {loading ? "Generating..." : "💬 Generate WA Fake"}
      </Button>
      {result?.success && (result.data?.result || result.data?.url) && <ImageResult url={result.data.result || result.data.url} />}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-wa-group") return (
    <div className="space-y-4">
      <Input placeholder="Kata kunci grup WA..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/search/grupwangcap", { text: v1 })}>
        {loading ? "Mencari..." : "🔍 Cari Grup WA"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {(Array.isArray(result.data.result) ? result.data.result : [result.data.result]).map((g: any, i: number) => (
            <div key={i} className="p-3 bg-black/60 border border-green-500/30 rounded-xl space-y-1">
              <div className="text-white font-bold text-sm">{g.name || g.subject}</div>
              {g.link && <a href={g.link} target="_blank" rel="noreferrer" className="text-[#00b4ff] text-xs break-all">{g.link}</a>}
            </div>
          ))}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  if (toolId === "iky-stk-yt") return (
    <div className="space-y-4">
      <Input placeholder="@username atau nama channel YouTube" value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" disabled={loading || !v1} onClick={() => runIky("/stalk/youtube", { username: v1.replace("@","") })}>
        {loading ? "Stalking..." : "🔍 Stalk YouTube"}
      </Button>
      {result?.success && result.data?.result && (
        <div className="p-4 bg-black/60 border border-red-500/30 rounded-xl space-y-2">
          {Array.isArray(result.data.result) ? result.data.result.map((ch: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              {ch.profile && <img src={ch.profile} alt="pp" className="w-12 h-12 rounded-full border border-red-500" />}
              <div>
                <div className="text-white font-bold text-sm">{ch.channelName}</div>
                <div className="text-gray-400 text-xs">{ch.subscriberH} {ch.verified ? "✅" : ""}</div>
                <a href={ch.url} target="_blank" rel="noreferrer" className="text-[#00b4ff] text-xs">Buka Channel</a>
              </div>
            </div>
          )) : <ResultCard data={result.data.result} />}
        </div>
      )}
      {result?.success === false && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );

  // ── Default fallback ──
  return (
    <div className="space-y-4">
      <Input placeholder="Input data..." value={v1} onChange={e => setV1(e.target.value)} className="cyber-input" />
      <Button className="cyber-button w-full h-12" onClick={() => toast({ title: "Diproses", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" })}>
        Proses Sekarang
      </Button>
    </div>
  );
}
