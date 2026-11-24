import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { CONFIG } from "@/config";

// ── Jam berjalan WIB ────────────────────────────────────────
// Memakai Intl dengan timeZone Asia/Jakarta supaya tetap benar
// walau perangkat pengguna di zona waktu lain.
function useJakartaClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Selaraskan ke detik berikutnya agar tidak melompat
    let interval: ReturnType<typeof setInterval>;
    const tick = () => setNow(new Date());
    const msToNextSecond = 1000 - (Date.now() % 1000);
    const t = setTimeout(() => {
      tick();
      interval = setInterval(tick, 1000);
    }, msToNextSecond);
    return () => {
      clearTimeout(t);
      if (interval) clearInterval(interval);
    };
  }, []);

  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: CONFIG.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat("id-ID", {
    timeZone: CONFIG.TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const year = new Intl.DateTimeFormat("id-ID", {
    timeZone: CONFIG.TIMEZONE,
    year: "numeric",
  }).format(now);

  return { time, date, year };
}

// ── Pemutar audio ───────────────────────────────────────────
// Sumber audio dinyatakan eksplisit di UI supaya jelas dari mana
// berkasnya berasal.
export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        el.volume = 0.35;
        await el.play();
        setPlaying(true);
        setFailed(false);
      }
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <audio
        ref={audioRef}
        src={CONFIG.AUDIO_SRC}
        loop
        preload="metadata"
        muted={muted}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Jeda audio" : "Putar audio"}
        title={failed ? "Audio tidak dapat dimuat" : CONFIG.AUDIO_LABEL}
        className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
          playing
            ? "border-[#00b4ff]/60 bg-[#00b4ff]/20 text-[#00b4ff]"
            : "border-white/15 bg-white/5 text-gray-300 hover:text-white hover:border-[#00b4ff]/40"
        }`}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => {
          const el = audioRef.current;
          const next = !muted;
          setMuted(next);
          if (el) el.muted = next;
        }}
        aria-label={muted ? "Nyalakan suara" : "Bisukan suara"}
        className="h-8 w-8 rounded-lg border border-white/15 bg-white/5 text-gray-300 hover:text-white hover:border-[#00b4ff]/40 flex items-center justify-center transition-colors"
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ── Blok jam + tanggal + tahun ──────────────────────────────
export function ClockBlock({ compact = false }: { compact?: boolean }) {
  const { time, date, year } = useJakartaClock();

  if (compact) {
    return (
      <div className="flex flex-col items-end leading-none">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-sm font-bold text-white tabular-nums tracking-tight">
            {time}
          </span>
          <span className="text-[9px] font-bold text-[#00b4ff]">{CONFIG.TZ_LABEL}</span>
        </div>
        <span className="text-[9px] text-gray-400 mt-0.5">{date}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-black text-white tabular-nums tracking-tight">
          {time}
        </span>
        <span className="text-[10px] font-bold text-[#00b4ff]">{CONFIG.TZ_LABEL}</span>
      </div>
      <span className="text-[10px] text-gray-400 mt-0.5">{date}</span>
      <span className="text-[9px] text-gray-600 font-mono mt-0.5">{year}</span>
    </div>
  );
}

// ── Logo warna-warni BADAK VIN ────────────────────────────────────────
// Palet: violet → indigo → magenta → cyan → emerald (tanpa oranye).
export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="relative shrink-0 rounded-xl overflow-hidden border border-white/15 shadow-[0_0_14px_rgba(124,58,237,0.35)]"
        style={{ width: size, height: size }}
      >
        <img
          src={CONFIG.LOGO}
          alt={`Logo ${CONFIG.BRAND}`}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-black tracking-wide leading-none truncate bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
          {CONFIG.BRAND}
        </div>
        <div className="text-[8px] text-gray-500 font-mono tracking-widest mt-0.5 truncate">
          {CONFIG.APP_NAME}
        </div>
      </div>
    </div>
  );
}

export { useJakartaClock };
