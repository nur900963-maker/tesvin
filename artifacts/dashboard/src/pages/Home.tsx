import { useState } from "react";
import { useGetStats } from "@workspace/api-client-react";
import { Users, Wifi, Star, ChevronDown, ChevronUp, MessageCircle, Shield, Bug, Send, Activity, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CONFIG } from "@/config";
import { AudioPlayer, ClockBlock } from "@/components/HeaderWidgets";
import bgImage from "@assets/IMG_20260528_130508_015_1782175582895.jpg";

const fiturItems = [
  {
    id: "badak",
    name: "WhatsApp Badak System",
    desc: "Mengirim badak file ke target nomor WhatsApp dengan berbagai metode.",
    icon: <Bug className="w-6 h-6 text-white" />,
    iconBg: "bg-red-500",
    detail: (
      <div className="mt-3 space-y-2 text-sm text-gray-300">
        <p>✅ <strong>Method 1–4</strong> tersedia untuk blast otomatis</p>
        <p>✅ Support nomor <strong>Old/Fresh</strong></p>
        <p>✅ Proses real-time dengan proxy 1.1.1.1</p>
        <p className="text-[#00b4ff] font-medium mt-2">Buka tab WhatsApp untuk mulai!</p>
      </div>
    )
  },
  {
    id: "tutorial",
    name: "Tutorial Badak System",
    desc: "Panduan lengkap cara badak WhatsApp step by step.",
    icon: <MessageCircle className="w-6 h-6 text-white" />,
    iconBg: "bg-green-500",
    detail: (
      <div className="mt-3 space-y-2 text-sm text-gray-300">
        {[
          "Beli Nomer Yang Old/Fresh Terlebih Dahulu.",
          "Pasang Email & Pin pada nomor.",
          "Diamkan Selama Kurang Lebih 1-7 hari, Jangan Lupa Setting Proxy Menjadi 1.1.1.1",
          "Pada Hari Ke 2 Matikan Proxy Lalu Tes Buat Blast.",
          "Jika Cuma Limit Dan Ga Kenon, Itu Jadi Sudah Proses Badak.",
          "Jika Limit Nyalakan Kembali Proxynya.",
          "Diamkan Sampai Limit Hilang, Jangan Buka WhatsApp.",
          "Selesai Dehh Badak. 🎉"
        ].map((step, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[#00b4ff] font-bold shrink-0">✓</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "security",
    name: "Advanced Security Tools",
    desc: "Tools keamanan level lanjut untuk perlindungan akun & data.",
    icon: <Shield className="w-6 h-6 text-white" />,
    iconBg: "bg-[#00b4ff]",
    detail: (
      <div className="mt-3 space-y-2 text-sm text-gray-300">
        <p>✅ <strong>NIK Check</strong> – Verifikasi identitas</p>
        <p>✅ <strong>Phone Lookup</strong> – Cek operator & region</p>
        <p>✅ <strong>Meta Bisnis</strong> – Verifikasi WA Business</p>
        <p>✅ <strong>IG Stalk</strong> – Info profil Instagram</p>
        <p className="text-[#00b4ff] font-medium mt-2">Buka tab Tools untuk akses!</p>
      </div>
    )
  },
];

export default function Home() {
  const { user } = useAuth();
  const { data: stats } = useGetStats();
  const { toast } = useToast();
  const [openFitur, setOpenFitur] = useState<string | null>(null);
  const [devMsg, setDevMsg] = useState("");

  const daysLeft = user?.expiredAt
    ? Math.max(0, Math.ceil((new Date(user.expiredAt).getTime() - Date.now()) / 86400000))
    : null;

  const newsItems = [
    { id: 1, title: CONFIG.APP_NAME, subtitle: "This Is New Update!! Version 5.0", image: bgImage },
    { id: 2, title: "New Tools Update", subtitle: "14 Tools Premium Tersedia", image: bgImage },
    { id: 3, title: "Bug Fixes", subtitle: "Stabilitas sistem ditingkatkan", image: bgImage },
  ];

  return (
    <div className="space-y-0">
      {/* Hero Banner */}
      <div className="relative h-44 overflow-hidden">
        <img src={bgImage} alt="hero" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/40 to-transparent" />
        <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5">
          <h2
            className="text-2xl font-black text-white tracking-widest text-center px-4"
            style={{ textShadow: "0 0 20px #00b4ff, 0 0 40px #00b4ff66" }}
          >
            {CONFIG.APP_NAME}
          </h2>
          <ClockBlock />
          <div className="flex items-center gap-2 mt-0.5">
            <AudioPlayer />
            <span className="text-[9px] text-gray-500 font-mono truncate max-w-[150px]">
              {CONFIG.AUDIO_SRC}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Welcome Card */}
        <div className="cyber-card p-4 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#00b4ff] rounded-full blur-[50px] opacity-15 pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="text-2xl mt-0.5">🖐</div>
            <div>
              <h3 className="text-white font-bold text-base mb-1">Selamat Datang!</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Halo Pengguna Setia <span className="text-[#00b4ff] font-bold">{CONFIG.APP_NAME}</span>! Terima kasih telah menggunakan Dashboard V5.0 versi terbaru.
                <br/><br/>
                Sistem ini dirancang untuk mempermudah pengelolaan bot WhatsApp, monitoring server, eksekusi perintah secara <em>real-time</em>, serta berbagai fitur terbaru yang lebih stabil dan cepat.
              </p>

              <div className="mt-4 mb-2">
                <div className="text-[#00b4ff] font-bold text-xs flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3" /> Fitur Unggulan V5.0:
                </div>
                <ul className="text-gray-300 text-[10px] space-y-1 ml-1">
                  <li>🤖 Membuat nokos lebih mudah dan mendukung promosi</li>
                  <li>📊 Monitoring server secara real-time</li>
                  <li>⚡ Eksekusi perintah cepat dan stabil</li>
                  <li>🎗 Sistem API terbaru yang lebih optimal</li>
                  <li>🏓 Create Nokos Badak dengan proses praktis</li>
                  <li>☄️ Membantu pengelolaan nokos dengan lebih aman</li>
                  <li>📂 Dashboard lebih modern dan responsif</li>
                  <li>🚀 Performa lebih cepat dibanding versi sebelumnya</li>
                </ul>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <span className="text-xs text-gray-400">Build Version: <span className="text-[#00b4ff] font-bold">{CONFIG.APP_VERSION}</span></span>
                <span className="text-xs text-gray-400">Last Updated: <span className="text-white font-bold">{CONFIG.APP_UPDATED}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="cyber-card p-4">
          <div className="text-xs text-gray-400 font-bold tracking-widest mb-3">WELCOME BACK</div>
          <div className="text-lg font-black text-white mb-3 cyber-glow-text">{CONFIG.APP_SUBTITLE}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 rounded-xl p-3 border border-[#00b4ff]/20 flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#00b4ff]/10 text-[#00b4ff]"><Users className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] text-gray-400">Online Users</div>
                <div className="text-lg font-bold text-white">{stats?.onlineUsers ?? 0}</div>
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-[#00b4ff]/20 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10 text-green-400"><Wifi className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] text-gray-400">Connections</div>
                <div className="text-lg font-bold text-white">{stats?.activeUsers ?? 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest News */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3 tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00b4ff]" /> LATEST NEWS
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
            {newsItems.map((item) => (
              <div key={item.id} className="min-w-[200px] snap-center relative rounded-xl overflow-hidden flex-shrink-0 h-28">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060a14]/90 via-black/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <div className="text-white font-bold text-xs leading-tight" style={{ textShadow: "0 0 10px #00b4ff" }}>{item.title}</div>
                  <div className="text-gray-300 text-[9px] mt-0.5">{item.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="cyber-card p-4">
          <h3 className="text-sm font-bold text-white mb-3 tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-[#00b4ff]" /> ACCOUNT INFO
          </h3>
          <div className="flex items-center gap-4 pb-4 border-b border-[#00b4ff]/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00b4ff] to-[#1e3a8a] flex items-center justify-center font-bold text-xl text-white border-2 border-[#00b4ff]/60 shadow-[0_0_12px_rgba(0,180,255,0.4)]">
              {user?.username?.substring(0, 2).toUpperCase() || "UN"}
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">USERNAME</div>
              <div className="text-white font-bold">{user?.username}</div>
            </div>
          </div>
          <div className="pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Role</span>
              <Badge className="bg-[#0a0e1a] text-[#00b4ff] border border-[#00b4ff]/40 text-[10px] px-2">{user?.role?.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Status</span>
              <Badge className="bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] px-2">{user?.status?.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Expired</span>
              <span className="text-[#00b4ff] text-xs font-mono">
                {daysLeft !== null ? `${daysLeft} Hari` : "Lifetime"}
              </span>
            </div>
          </div>
        </div>

        {/* FITUR UTAMA — Accordion like screenshot */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3 tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-[#00b4ff] fill-[#00b4ff]" /> FITUR UTAMA
          </h3>
          <div className="space-y-2">
            {fiturItems.map((item) => {
              const isOpen = openFitur === item.id;
              return (
                <div key={item.id} className="cyber-card overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setOpenFitur(isOpen ? null : item.id)}
                  >
                    <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{item.name}</div>
                      {!isOpen && <div className="text-gray-400 text-xs mt-0.5 truncate">{item.desc}</div>}
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-[#00b4ff] shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#00b4ff]/10 pt-3">
                      {item.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kirim Pesan ke Dev */}
        <div className="cyber-card p-4">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#00b4ff]" /> KIRIM PESAN KE DEV
          </h3>
          <p className="text-xs text-gray-400 mb-3">Punya saran, kritik, atau menemukan bug? Kirim pesan langsung ke developer utama.</p>
          <Textarea
            className="cyber-input resize-none text-sm mb-3"
            rows={3}
            placeholder="Tulis pesan Anda disini..."
            value={devMsg}
            onChange={(e) => setDevMsg(e.target.value)}
          />
          <Button
            className="cyber-button w-full h-11"
            onClick={() => {
              if (!devMsg.trim()) return;
              window.open(`https://t.me/${CONFIG.DEV.replace("@", "")}`, "_blank");
              toast({ title: "Pesan Dikirim", description: "Terima kasih! Pesan Anda telah diterima.", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
              setDevMsg("");
            }}
          >
            Kirim Pesan
          </Button>
        </div>

        <div className="text-center pb-4">
          <p className="text-xs text-[#00b4ff] font-bold mb-2">VINCENT WORLD V5.0 — Faster • Stable • More Powerful 🚀</p>
          <p className="text-[10px] text-gray-500 font-mono">Dev {CONFIG.DEV} | Channel: {CONFIG.CHANNEL} | Tools: {CONFIG.TOOLS_NAME}</p>
        </div>
      </div>
    </div>
  );
}
