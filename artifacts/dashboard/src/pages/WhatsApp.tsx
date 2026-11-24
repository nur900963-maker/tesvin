import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Send, CheckCheck, RotateCcw, Zap, Shield, Activity,
  Unlock, BadgeCheck, Ban, Instagram, Facebook, AlertCircle,
} from "lucide-react";
import { CONFIG } from "@/config";
import bgImage from "@assets/IMG_20260528_130508_015_1782175582895.jpg";

// ─── Steps per tool ─────────────────────────────────────────
const STEPS: Record<string, string[]> = {
  badak:      ["Validating Data...", "Preparing System...", "Connecting to Server...", "Processing Request...", "Finalizing...", "Generating Result..."],
  unband:     ["Validating Number...", "Connecting to WA Server...", "Checking Ban Status...", "Sending Unband Request...", "Verifying Removal...", "Unband Complete!"],
  centang:    ["Validating Number...", "Connecting to Meta API...", "Checking Eligibility...", "Submitting Verification...", "Processing Approval...", "Verification Done!"],
  banig:      ["Validating Target...", "Connecting to Instagram...", "Scanning Activity...", "Submitting Report...", "Processing Request...", "Report Submitted!"],
  centangig:  ["Validating Account...", "Connecting to Meta...", "Checking Eligibility...", "Submitting Request...", "Processing Review...", "Verification Done!"],
  bantiktok:  ["Validating Target...", "Connecting to TikTok...", "Scanning Violations...", "Submitting Report...", "Processing Request...", "Report Complete!"],
  facebook:   ["Validating Target...", "Connecting to Facebook...", "Scanning Account...", "Submitting Report...", "Processing Request...", "Report Submitted!"],
};

function getStep(progress: number, steps: string[]): string {
  const idx = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
  return steps[idx];
}

// ─── Progress Hook ───────────────────────────────────────────
// Progress completes in ~8-12 seconds. API is fired immediately on start;
// result is shown when BOTH progress=100 AND API response arrived.
function useWaTool() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiDoneRef = useRef(false);
  const progDoneRef = useRef(false);
  const resultRef = useRef<any>(null);
  const errorRef = useRef<string | null>(null);

  const finish = () => {
    setIsRunning(false);
    setIsDone(true);
    setResult(resultRef.current);
    setError(errorRef.current);
  };

  const checkBothDone = () => {
    if (apiDoneRef.current && progDoneRef.current) finish();
  };

  const run = async (apiFn: () => Promise<any>) => {
    // Reset state
    setProgress(0); setIsDone(false); setResult(null); setError(null);
    setIsRunning(true);
    apiDoneRef.current = false; progDoneRef.current = false;
    resultRef.current = null; errorRef.current = null;

    // 1. Fire API immediately
    apiFn().then(data => {
      if (data?.success) {
        resultRef.current = data;
      } else {
        errorRef.current = data?.message || data?.error || "Terjadi kesalahan";
        resultRef.current = data;
      }
      apiDoneRef.current = true;
      checkBothDone();
    }).catch(err => {
      errorRef.current = err?.message || "Koneksi gagal";
      apiDoneRef.current = true;
      checkBothDone();
    });

    // 2. Run progress animation concurrently (~8-12s total)
    let current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      // Increment: fast at start/middle, slow near 95 (wait for API)
      const inc = current < 30
        ? Math.random() * 6 + 4       // 4-10% fast early
        : current < 70
          ? Math.random() * 5 + 3     // 3-8% mid
          : current < 90
            ? Math.random() * 3 + 1   // 1-4% slow near end
            : Math.random() * 1 + 0.3; // 0.3-1.3% hold near 95
      current = Math.min(current + inc, 99); // cap at 99 until API done
      if (apiDoneRef.current) current = 100;  // jump to 100 when API returns
      setProgress(Math.floor(current));

      if (current >= 100) {
        clearInterval(intervalRef.current!);
        progDoneRef.current = true;
        checkBothDone();
      }
    }, 300);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0); setIsRunning(false); setIsDone(false); setResult(null); setError(null);
    apiDoneRef.current = false; progDoneRef.current = false;
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { progress, isRunning, isDone, result, error, run, reset };
}

// ─── Call API helper ────────────────────────────────────────
async function callApi(path: string, body: Record<string, unknown>) {
  const token = localStorage.getItem("auth_token");
  const resp = await fetch(`/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    return { success: false, error: err.error || `HTTP ${resp.status}` };
  }
  return resp.json();
}

// ─── Progress Bar UI ────────────────────────────────────────
function ProgressSection({ progress, toolId }: { progress: number; toolId: string }) {
  const steps = STEPS[toolId] || STEPS.badak;
  const currentStep = getStep(progress, steps);
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-2 text-[#00b4ff] animate-pulse">
        <Activity className="w-4 h-4" />
        <span className="text-sm font-mono font-medium">{currentStep}</span>
      </div>
      <div className="relative h-3 bg-gray-800/80 rounded-full overflow-hidden border border-[#00b4ff]/20">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #00b4ff, #1e90ff, #00b4ff)",
            transition: "width 0.25s ease",
          }}
        />
      </div>
      <div className="flex justify-between items-center">
        <div className="text-white font-bold text-2xl tabular-nums">{progress}%</div>
        <div className="text-gray-400 text-xs font-mono">Processing...</div>
      </div>
      <div className="space-y-1.5 pt-1">
        {steps.map((s, i) => {
          const threshold = ((i + 1) / steps.length) * 100;
          const done = progress >= threshold;
          const active = !done && progress >= (i / steps.length) * 100;
          return (
            <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${done ? "text-green-400" : active ? "text-[#00b4ff]" : "text-gray-600"}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? "bg-green-400" : active ? "bg-[#00b4ff] animate-pulse" : "bg-gray-700"}`} />
              {s}
              {done && <CheckCheck className="w-3 h-3 ml-auto" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Error Block ────────────────────────────────────────────
function ErrorBlock({ msg, onReset }: { msg: string; onReset: () => void }) {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-red-400 font-bold text-sm">Gagal</div>
          <div className="text-gray-300 text-xs mt-1">{msg}</div>
        </div>
      </div>
      <Button className="w-full h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold text-sm" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" /> Coba Lagi
      </Button>
    </div>
  );
}

// ─── Tutorial Card ──────────────────────────────────────────
const TUTORIALS: Record<string, string[]> = {
  badak: [
    "Beli Nomer Yang Old/Fresh Terlebih Dahulu.",
    "Pasang Email & Pin pada nomor WhatsApp.",
    "Diamkan Selama Kurang Lebih 1-7 hari, Setting Proxy 1.1.1.1.",
    "Pada Hari Ke 2 Matikan Proxy Lalu Tes Buat Blast.",
    "Jika Cuma Limit Dan Ga Kenon, Itu Jadi Sudah Proses Badak.",
    "Jika Limit Nyalakan Kembali Proxynya.",
    "Diamkan Sampai Limit Hilang, Jangan Buka WhatsApp.",
    "Selesai Dehh Badak. 🎉",
  ],
  unband: [
    "Masukkan nomor WA yang terkena ban.",
    "Sistem akan mengirim request unband ke server Meta.",
    "Proses membutuhkan waktu 1×24 jam untuk efektif.",
    "Jangan login ke nomor tersebut selama proses berlangsung.",
    "Setelah 24 jam, coba login kembali.",
  ],
  centang: [
    "Masukkan nomor WhatsApp Business yang ingin diverifikasi.",
    "Pastikan akun sudah terdaftar sebagai WhatsApp Business.",
    "Proses verifikasi membutuhkan waktu 3-7 hari kerja.",
    "Meta akan mengirim notifikasi ke email terdaftar.",
    "Setelah disetujui, centang hijau akan muncul otomatis.",
  ],
  banig: [
    "Masukkan username Instagram target.",
    "Sistem akan mengirim laporan pelanggaran ke Meta.",
    "Proses review dilakukan oleh tim Meta dalam 24-48 jam.",
    "Akun yang melanggar TOS akan dibanned secara otomatis.",
    "Tunggu konfirmasi dari sistem.",
  ],
  centangig: [
    "Masukkan username Instagram yang ingin diverifikasi.",
    "Akun harus memiliki minimal 10K followers.",
    "Akun harus aktif dan tidak memiliki riwayat pelanggaran.",
    "Proses review berlangsung 30-45 hari.",
    "Meta akan mengirim notifikasi hasil via email.",
  ],
  bantiktok: [
    "Masukkan username TikTok target.",
    "Sistem mengirim laporan pelanggaran komunitas.",
    "Tim TikTok akan melakukan review dalam 24-72 jam.",
    "Konten yang melanggar akan dihapus otomatis.",
    "Akun bermasalah dapat dibanned permanen.",
  ],
  facebook: [
    "Masukkan username/ID Facebook target.",
    "Pilih jenis laporan yang sesuai.",
    "Sistem akan mengirim laporan ke Meta Transparency Center.",
    "Proses review berlangsung 24-72 jam.",
    "Hasilnya akan dikirim ke email terdaftar.",
  ],
};

function TutorialCard({ toolId }: { toolId: string }) {
  const titles: Record<string, string> = {
    badak: "CARA BADAK WHATSAPP", unband: "CARA UNBAND WHATSAPP",
    centang: "CARA CENTANG WHATSAPP", banig: "CARA BAND INSTAGRAM",
    centangig: "CARA CENTANG INSTAGRAM", bantiktok: "CARA BAND TIKTOK",
    facebook: "CARA FACEBOOK TOOLS",
  };
  const items = TUTORIALS[toolId] || [];
  return (
    <div className="cyber-card p-5">
      <h3 className="font-bold text-[#00b4ff] tracking-wider text-sm text-center mb-4 pb-2 border-b border-[#00b4ff]/20">{titles[toolId]}</h3>
      <ul className="space-y-3">
        {items.map((text, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#00b4ff] shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300 leading-snug">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── TAB CONFIG ─────────────────────────────────────────────
const WA_TABS = [
  { id: "badak",     label: "Badak WA",    icon: <Zap className="w-4 h-4" />,          bg: "bg-green-500",   color: "text-green-400" },
  { id: "unband",    label: "Unband WA",   icon: <Unlock className="w-4 h-4" />,        bg: "bg-blue-500",    color: "text-blue-400" },
  { id: "centang",   label: "Centang WA",  icon: <BadgeCheck className="w-4 h-4" />,    bg: "bg-[#00b4ff]",   color: "text-[#00b4ff]" },
  { id: "banig",     label: "Band IG",     icon: <Instagram className="w-4 h-4" />,     bg: "bg-pink-500",    color: "text-pink-400" },
  { id: "centangig", label: "Centang IG",  icon: <BadgeCheck className="w-4 h-4" />,    bg: "bg-purple-500",  color: "text-purple-400" },
  { id: "bantiktok", label: "Band TikTok", icon: <Ban className="w-4 h-4" />,           bg: "bg-red-500",     color: "text-red-400" },
  { id: "facebook",  label: "Facebook",    icon: <Facebook className="w-4 h-4" />,      bg: "bg-blue-700",    color: "text-blue-500" },
];

// ─── BADAK TOOL ─────────────────────────────────────────────
function BadakTool({ user }: { user: any }) {
  const { toast } = useToast();
  const [targetNumber, setTargetNumber] = useState("");
  const [method, setMethod] = useState("method-1");
  const { progress, isRunning, isDone, result, error, run, reset } = useWaTool();

  const daysLeft = user?.expiredAt
    ? Math.max(0, Math.ceil((new Date(user.expiredAt).getTime() - Date.now()) / 86400000))
    : null;

  const handleExecute = () => {
    if (!targetNumber) {
      toast({ variant: "destructive", title: "Error", description: "Masukkan nomor target!" });
      return;
    }
    run(() => callApi("/tools/whatsapp-badak", { targetNumber, method })).then(() => {
      if (!error) toast({ title: "✅ Berhasil!", description: `File Badak terpasang di ${targetNumber}`, className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
    });
  };

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="cyber-card p-4 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00b4ff]/10 via-transparent to-[#1e3a8a]/20 pointer-events-none" />
        <div className="relative w-14 h-14 shrink-0">
          <img src={bgImage} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-[#00b4ff] shadow-[0_0_15px_rgba(0,180,255,0.4)]" />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0e1a] animate-pulse" />
        </div>
        <div>
          <div className="font-bold text-white cyber-glow-text">{user?.username}</div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="bg-black/50 text-white border-gray-600 text-[10px]">ROLE: {user?.role?.toUpperCase()}</Badge>
            <Badge className="bg-[#00b4ff]/20 text-[#00b4ff] border border-[#00b4ff]/50 text-[10px]">EXP: {daysLeft !== null ? `${daysLeft} Days` : "Lifetime"}</Badge>
          </div>
        </div>
      </div>

      <div className="cyber-card p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#00b4ff]/20">
          <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
            <CheckCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-base">BADAK WHATSAPP</div>
            <div className="text-xs text-gray-400">Status: <span className="text-green-400">Active</span> | Method: 4 Available</div>
          </div>
        </div>

        {isRunning && <ProgressSection progress={progress} toolId="badak" />}

        {isDone && error && <ErrorBlock msg={error} onReset={() => { reset(); setTargetNumber(""); }} />}

        {isDone && !error && result && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
            <p className="text-green-400 font-bold text-base">Badak Berhasil Dipasang!</p>
            <p className="text-gray-300 text-sm">Nomor <span className="text-white font-bold">{targetNumber}</span> sudah dipasang file Badak.</p>
            <p className="text-[#00b4ff] font-medium text-sm">Tunggu 1–7 hari menggunakan Proxy 1.1.1.1 ✅</p>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-gray-400">
              <div className="p-2 bg-black/40 rounded-lg"><div className="text-white font-mono font-bold">{targetNumber}</div><div>Target Number</div></div>
              <div className="p-2 bg-black/40 rounded-lg"><div className="text-[#00b4ff] font-bold">{method.replace("-", " ").toUpperCase()}</div><div>Method Used</div></div>
            </div>
          </div>
        )}

        {!isRunning && !isDone && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-mono tracking-wider">TARGET NUMBER</label>
              <Input placeholder="628xxxxxxxxxx" value={targetNumber} onChange={e => setTargetNumber(e.target.value)} className="cyber-input font-mono" type="tel" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-mono tracking-wider">SELECT METHOD</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="cyber-input w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white">
                  <SelectItem value="method-1">Method 1 — Classic Badak</SelectItem>
                  <SelectItem value="method-2">Method 2 — Stealth Mode</SelectItem>
                  <SelectItem value="method-3">Method 3 — Deep Inject</SelectItem>
                  <SelectItem value="method-4">Method 4 — Turbo Blast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isDone && !error ? (
          <Button className="w-full h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold" onClick={() => { reset(); setTargetNumber(""); }}>
            <RotateCcw className="w-4 h-4 mr-2" /> RESET / NOMOR BARU
          </Button>
        ) : !isRunning && !isDone ? (
          <Button className="w-full cyber-button h-12 text-base font-bold rounded-full" onClick={handleExecute}>
            <Send className="mr-2 w-5 h-5" /> Let's Go
          </Button>
        ) : isRunning ? (
          <Button className="w-full cyber-button h-12 text-base font-bold rounded-full" disabled>
            <span className="animate-pulse">Memproses {progress}%...</span>
          </Button>
        ) : null}
      </div>
      <TutorialCard toolId="badak" />
    </div>
  );
}

// ─── Generic Tool Factory ────────────────────────────────────
// Each tool = config object → rendered by GenericWaTool
interface WaToolConfig {
  toolId: string;
  title: string;
  subtitle: string;
  iconBg: string;
  icon: React.ReactNode;
  btnGradient: string;
  btnLabel: string;
  apiPath: string;
  buildBody: (fields: Record<string, string>) => Record<string, string>;
  renderSuccess: (result: any, fields: Record<string, string>) => React.ReactNode;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type?: "text" | "tel" | "select";
    options?: { value: string; label: string }[];
  }>;
}

function GenericWaTool({ cfg }: { cfg: WaToolConfig }) {
  const { toast } = useToast();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(cfg.fields.map(f => [f.key, f.options?.[0]?.value ?? ""]))
  );
  const { progress, isRunning, isDone, result, error, run, reset } = useWaTool();

  const setField = (key: string, val: string) =>
    setFieldValues(prev => ({ ...prev, [key]: val }));

  const handleExecute = () => {
    const required = cfg.fields.filter(f => f.type !== "select");
    const missing = required.find(f => !fieldValues[f.key]?.trim());
    if (missing) {
      toast({ variant: "destructive", title: "Error", description: `${missing.label} wajib diisi!` });
      return;
    }
    const body = cfg.buildBody(fieldValues);
    run(() => callApi(cfg.apiPath, body)).then(() => {
      if (!error) {
        toast({ title: "✅ Berhasil!", className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
      }
    });
  };

  const handleReset = () => {
    reset();
    setFieldValues(Object.fromEntries(cfg.fields.map(f => [f.key, f.options?.[0]?.value ?? ""])));
  };

  return (
    <div className="space-y-4">
      <div className="cyber-card p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#00b4ff]/20">
          <div className={`w-11 h-11 ${cfg.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
            {cfg.icon}
          </div>
          <div>
            <div className="font-bold text-white text-base">{cfg.title}</div>
            <div className="text-xs text-gray-400">{cfg.subtitle}</div>
          </div>
        </div>

        {isRunning && <ProgressSection progress={progress} toolId={cfg.toolId} />}

        {isDone && error && <ErrorBlock msg={error} onReset={handleReset} />}

        {isDone && !error && result && cfg.renderSuccess(result, fieldValues)}

        {!isRunning && !isDone && (
          <div className="space-y-3">
            {cfg.fields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 mb-1.5 block font-mono tracking-wider">{f.label}</label>
                {f.type === "select" && f.options ? (
                  <Select value={fieldValues[f.key]} onValueChange={v => setField(f.key, v)}>
                    <SelectTrigger className="cyber-input w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white">
                      {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder={f.placeholder} value={fieldValues[f.key]} onChange={e => setField(f.key, e.target.value)}
                    className="cyber-input font-mono" type={f.type || "text"} />
                )}
              </div>
            ))}
          </div>
        )}

        {isDone && !error ? (
          <Button className="w-full h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> REQUEST BARU
          </Button>
        ) : !isRunning && !isDone ? (
          <Button className={`w-full h-12 ${cfg.btnGradient} hover:opacity-90 text-white font-bold rounded-full`} onClick={handleExecute}>
            {cfg.icon && <span className="mr-2 w-5 h-5">{cfg.icon}</span>}
            {cfg.btnLabel}
          </Button>
        ) : isRunning ? (
          <Button className="w-full h-12 bg-gray-700 text-white font-bold rounded-full" disabled>
            <span className="animate-pulse">Memproses {progress}%...</span>
          </Button>
        ) : null}
      </div>
      <TutorialCard toolId={cfg.toolId} />
    </div>
  );
}

// ─── Tool Configs ────────────────────────────────────────────
function SuccessRow({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`${color} font-mono`}>{value}</span>
    </div>
  );
}

const UNBAND_CFG: WaToolConfig = {
  toolId: "unband", title: "UNBAND WHATSAPP", subtitle: "Pulihkan nomor WA yang terkena ban",
  iconBg: "bg-gradient-to-br from-blue-500 to-blue-700",
  icon: <Unlock className="w-6 h-6 text-white" />,
  btnGradient: "bg-gradient-to-r from-blue-600 to-blue-800",
  btnLabel: "Unband Sekarang",
  apiPath: "/tools/unband-wa",
  buildBody: f => ({ phone: f.phone }),
  fields: [{ key: "phone", label: "NOMOR WA YANG TERKENA BAN", placeholder: "628xxxxxxxxxx", type: "tel" }],
  renderSuccess: (result, f) => (
    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2"><Unlock className="w-5 h-5 text-blue-400" /><span className="text-blue-400 font-bold">Unband Request Berhasil Dikirim!</span></div>
      <div className="space-y-2 text-xs">
        <SuccessRow label="Nomor Target" value={f.phone} />
        <SuccessRow label="Request ID" value={result.data?.requestId || `UNB-${Date.now().toString().slice(-8)}`} color="text-[#00b4ff]" />
        <SuccessRow label="Status" value="PROCESSING" color="text-blue-400" />
        <SuccessRow label="Estimasi" value="1×24 jam" />
        <SuccessRow label="Waktu Kirim" value={new Date().toLocaleString("id-ID")} />
      </div>
      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
        ⚠️ Jangan login ke nomor tersebut selama 24 jam proses berlangsung.
      </div>
    </div>
  ),
};

const CENTANG_WA_CFG: WaToolConfig = {
  toolId: "centang", title: "CENTANG WHATSAPP", subtitle: "Verifikasi WA Business Badge",
  iconBg: "bg-gradient-to-br from-[#00b4ff] to-[#1e90ff]",
  icon: <BadgeCheck className="w-6 h-6 text-white" />,
  btnGradient: "bg-gradient-to-r from-[#00b4ff] to-[#1e90ff]",
  btnLabel: "Request Verifikasi",
  apiPath: "/tools/centang-wa",
  buildBody: f => ({ phone: f.phone, bizName: f.bizName }),
  fields: [
    { key: "phone", label: "NOMOR WA BUSINESS", placeholder: "628xxxxxxxxxx", type: "tel" },
    { key: "bizName", label: "NAMA BISNIS", placeholder: "Nama bisnis Anda..." },
  ],
  renderSuccess: (result, f) => (
    <div className="p-4 bg-[#00b4ff]/10 border border-[#00b4ff]/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-[#00b4ff]" /><span className="text-[#00b4ff] font-bold">Request Verifikasi Terkirim!</span></div>
      <div className="space-y-2 text-xs">
        <SuccessRow label="Nomor" value={f.phone} />
        <SuccessRow label="Nama Bisnis" value={f.bizName} />
        <SuccessRow label="Ticket ID" value={result.data?.ticketId || `VRF-${Date.now().toString().slice(-8)}`} color="text-[#00b4ff]" />
        <SuccessRow label="Status" value="UNDER REVIEW" color="text-yellow-400" />
        <SuccessRow label="Estimasi" value="3–7 hari kerja" />
        <SuccessRow label="Score" value={`${result.data?.score || "87"}/100`} color="text-green-400" />
      </div>
    </div>
  ),
};

const BAND_IG_CFG: WaToolConfig = {
  toolId: "banig", title: "BAND INSTAGRAM", subtitle: "Laporkan & Band akun Instagram target",
  iconBg: "bg-gradient-to-br from-pink-500 to-purple-600",
  icon: <Instagram className="w-6 h-6 text-white" />,
  btnGradient: "bg-gradient-to-r from-pink-600 to-purple-600",
  btnLabel: "Band Sekarang",
  apiPath: "/tools/band-instagram",
  buildBody: f => ({ username: f.username.replace("@", ""), reason: f.reason }),
  fields: [
    { key: "username", label: "USERNAME INSTAGRAM TARGET", placeholder: "@username" },
    { key: "reason", label: "ALASAN REPORT", type: "select", options: [
      { value: "spam", label: "Spam" }, { value: "hate", label: "Ujaran Kebencian" },
      { value: "harassment", label: "Pelecehan" }, { value: "fake", label: "Akun Palsu" },
      { value: "violence", label: "Konten Kekerasan" }, { value: "scam", label: "Penipuan" },
    ]},
  ],
  renderSuccess: (result, f) => (
    <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2"><Ban className="w-5 h-5 text-pink-400" /><span className="text-pink-400 font-bold">Report Instagram Berhasil Dikirim!</span></div>
      <div className="space-y-2 text-xs">
        <SuccessRow label="Target" value={`@${f.username.replace("@", "")}`} />
        <SuccessRow label="Report ID" value={result.data?.reportId || `IGR-${Date.now().toString().slice(-8)}`} color="text-pink-400" />
        <SuccessRow label="Alasan" value={f.reason} />
        <SuccessRow label="Total Report" value={`${result.data?.totalReports || "150+"} Reports`} color="text-red-400" />
        <SuccessRow label="Status" value="UNDER REVIEW" color="text-yellow-400" />
        <SuccessRow label="Estimasi Ban" value="24–48 jam" />
      </div>
    </div>
  ),
};

const CENTANG_IG_CFG: WaToolConfig = {
  toolId: "centangig", title: "CENTANG INSTAGRAM", subtitle: "Verifikasi akun Instagram centang biru",
  iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600",
  icon: <BadgeCheck className="w-6 h-6 text-white" />,
  btnGradient: "bg-gradient-to-r from-purple-600 to-indigo-600",
  btnLabel: "Request Centang IG",
  apiPath: "/tools/centang-instagram",
  buildBody: f => ({ username: f.username.replace("@", ""), category: f.category }),
  fields: [
    { key: "username", label: "USERNAME INSTAGRAM", placeholder: "@username" },
    { key: "category", label: "KATEGORI AKUN", type: "select", options: [
      { value: "personal", label: "Personal" }, { value: "creator", label: "Creator / Influencer" },
      { value: "brand", label: "Brand / Business" }, { value: "news", label: "Media / Berita" },
      { value: "public", label: "Public Figure" },
    ]},
  ],
  renderSuccess: (result, f) => (
    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-purple-400" /><span className="text-purple-400 font-bold">Request Verifikasi IG Terkirim!</span></div>
      <div className="space-y-2 text-xs">
        <SuccessRow label="Username" value={`@${f.username.replace("@", "")}`} />
        <SuccessRow label="Kategori" value={f.category} />
        <SuccessRow label="Ticket ID" value={result.data?.ticketId || `IGV-${Date.now().toString().slice(-8)}`} color="text-purple-400" />
        <SuccessRow label="Status" value="PENDING REVIEW" color="text-yellow-400" />
        <SuccessRow label="Estimasi" value="30–45 hari" />
        <SuccessRow label="Score" value={`${result.data?.score || "87"}/100`} color="text-green-400" />
      </div>
    </div>
  ),
};

const BAND_TIKTOK_CFG: WaToolConfig = {
  toolId: "bantiktok", title: "BAND TIKTOK", subtitle: "Laporkan & Band akun TikTok target",
  iconBg: "bg-gradient-to-br from-red-500 to-red-700",
  icon: <Ban className="w-6 h-6 text-white" />,
  btnGradient: "bg-gradient-to-r from-red-600 to-red-800",
  btnLabel: "Band TikTok",
  apiPath: "/tools/band-tiktok",
  buildBody: f => ({ username: f.username.replace("@", ""), reason: f.reason }),
  fields: [
    { key: "username", label: "USERNAME TIKTOK TARGET", placeholder: "@username" },
    { key: "reason", label: "ALASAN REPORT", type: "select", options: [
      { value: "spam", label: "Spam" }, { value: "hate", label: "Ujaran Kebencian" },
      { value: "harassment", label: "Pelecehan" }, { value: "fake", label: "Akun Palsu" },
      { value: "violence", label: "Konten Kekerasan" }, { value: "dangerous", label: "Konten Berbahaya" },
    ]},
  ],
  renderSuccess: (result, f) => (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2"><Ban className="w-5 h-5 text-red-400" /><span className="text-red-400 font-bold">Report TikTok Berhasil Dikirim!</span></div>
      <div className="space-y-2 text-xs">
        <SuccessRow label="Target" value={`@${f.username.replace("@", "")}`} />
        <SuccessRow label="Report ID" value={result.data?.reportId || `TTR-${Date.now().toString().slice(-8)}`} color="text-red-400" />
        <SuccessRow label="Alasan" value={f.reason} />
        <SuccessRow label="Total Report" value={`${result.data?.totalReports || "80+"} Reports`} color="text-red-400" />
        <SuccessRow label="Status" value="UNDER REVIEW" color="text-yellow-400" />
        <SuccessRow label="Estimasi Ban" value="24–72 jam" />
      </div>
    </div>
  ),
};

const FACEBOOK_CFG: WaToolConfig = {
  toolId: "facebook", title: "FACEBOOK TOOLS", subtitle: "Laporkan akun Facebook / Meta target",
  iconBg: "bg-gradient-to-br from-blue-600 to-blue-800",
  icon: <Facebook className="w-6 h-6 text-white" />,
  btnGradient: "bg-gradient-to-r from-blue-700 to-blue-900",
  btnLabel: "Laporkan ke Meta",
  apiPath: "/tools/facebook-report",
  buildBody: f => ({ target: f.target, reportType: f.reportType }),
  fields: [
    { key: "target", label: "USERNAME / LINK FACEBOOK TARGET", placeholder: "username atau link profil" },
    { key: "reportType", label: "JENIS LAPORAN", type: "select", options: [
      { value: "spam", label: "Spam" }, { value: "fake", label: "Akun Palsu" },
      { value: "scam", label: "Penipuan" }, { value: "harassment", label: "Pelecehan" },
      { value: "hate", label: "Ujaran Kebencian" }, { value: "impersonation", label: "Penyamaran Identitas" },
    ]},
  ],
  renderSuccess: (result, f) => (
    <div className="p-4 bg-blue-700/10 border border-blue-700/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2"><Facebook className="w-5 h-5 text-blue-400" /><span className="text-blue-400 font-bold">Report Facebook Berhasil Dikirim!</span></div>
      <div className="space-y-2 text-xs">
        <SuccessRow label="Target" value={f.target} />
        <SuccessRow label="Report ID" value={result.data?.reportId || `FBR-${Date.now().toString().slice(-8)}`} color="text-blue-400" />
        <SuccessRow label="Jenis Report" value={f.reportType} />
        <SuccessRow label="Total Reports" value={`${result.data?.totalReports || "100+"} Reports`} color="text-red-400" />
        <SuccessRow label="Status" value="SUBMITTED TO META" color="text-yellow-400" />
        <SuccessRow label="Estimasi Review" value="24–72 jam" />
      </div>
    </div>
  ),
};

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function WhatsApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("badak");

  return (
    <div className="p-4 space-y-4">
      {/* Horizontal scrollable tab menu */}
      <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 min-w-max">
          {WA_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? `${tab.bg} text-white shadow-lg scale-105`
                    : "bg-[#0a0e1a] border border-[#00b4ff]/20 text-gray-400 hover:text-white hover:border-[#00b4ff]/50"
                }`}
              >
                <span className={isActive ? "text-white" : tab.color}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tool */}
      {activeTab === "badak"     && <BadakTool user={user} />}
      {activeTab === "unband"    && <GenericWaTool cfg={UNBAND_CFG} />}
      {activeTab === "centang"   && <GenericWaTool cfg={CENTANG_WA_CFG} />}
      {activeTab === "banig"     && <GenericWaTool cfg={BAND_IG_CFG} />}
      {activeTab === "centangig" && <GenericWaTool cfg={CENTANG_IG_CFG} />}
      {activeTab === "bantiktok" && <GenericWaTool cfg={BAND_TIKTOK_CFG} />}
      {activeTab === "facebook"  && <GenericWaTool cfg={FACEBOOK_CFG} />}

      <div className="text-center pb-4">
        <p className="text-[10px] text-gray-500 font-mono">Dev {CONFIG.DEV} | Channel: {CONFIG.CHANNEL} | Tools: {CONFIG.TOOLS_NAME}</p>
      </div>
    </div>
  );
}
