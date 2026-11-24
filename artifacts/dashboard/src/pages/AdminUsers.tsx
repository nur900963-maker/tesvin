import { useMemo, useState } from "react";
import { useListUsers, useCreateUser, useBanUser, useDeleteUser, useUpdateUser, User } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Shield, Trash2, Ban, Edit, Plus, Users as UsersIcon, CheckCircle2, Clock,
  User as UserIcon, Key, Tag, Calendar, Copy, Check, Crown, Briefcase,
  Globe, Infinity as InfinityIcon, Eye, EyeOff,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type RoleType = "user" | "reseller" | "admin";

const DURATION_PRESETS = [
  { label: "7 Hari", days: "7" },
  { label: "30 Hari", days: "30" },
  { label: "90 Hari", days: "90" },
  { label: "365 Hari", days: "365" },
  { label: "Permanen", days: "0" },
] as const;

const ROLE_META: Record<RoleType, { label: string; icon: React.ReactNode; color: string; ring: string }> = {
  user:     { label: "User",     icon: <UserIcon className="w-3.5 h-3.5" />,  color: "text-[#00b4ff]",  ring: "border-[#00b4ff]/50 bg-[#00b4ff]/10" },
  reseller: { label: "Reseller", icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-purple-400", ring: "border-purple-500/50 bg-purple-500/10" },
  admin:    { label: "Admin",    icon: <Crown className="w-3.5 h-3.5" />,     color: "text-yellow-400", ring: "border-yellow-500/50 bg-yellow-500/10" },
};

// ── Field yang bisa diklik untuk disalin ────────────────────
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    // Strategi berlapis. Di sebagian WebView Android / in-app browser,
    // navigator.clipboard ADA tetapi writeText DITOLAK (NotAllowedError),
    // jadi kita tidak boleh berhenti di percobaan pertama.
    const legacyCopy = (): boolean => {
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    };

    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        ok = true;
      } catch {
        ok = legacyCopy();
      }
    } else {
      ok = legacyCopy();
    }

    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-left transition-colors hover:border-[#00b4ff]/50 hover:bg-[#00b4ff]/5 active:scale-[0.99]"
      title={`Klik untuk menyalin ${label.toLowerCase()}`}
    >
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm text-white font-mono truncate">{value}</div>
      </div>
      <span
        className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${
          copied
            ? "bg-green-500/20 text-green-400"
            : "bg-white/5 text-gray-400 group-hover:bg-[#00b4ff]/20 group-hover:text-[#00b4ff]"
        }`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Tersalin" : "Salin"}
      </span>
    </button>
  );
}

// ── Kartu hasil pembuatan akun ──────────────────────────────
function CreatedAccountCard({
  username, password, role, expiredAt, onClose,
}: {
  username: string; password: string; role: RoleType; expiredAt: string | null; onClose: () => void;
}) {
  const meta = ROLE_META[role];
  const permanent = !expiredAt;
  const expiredLabel = permanent
    ? "Permanen"
    : new Date(expiredAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const daysLeft = permanent
    ? null
    : Math.max(0, Math.ceil((new Date(expiredAt).getTime() - Date.now()) / 86400000));

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-green-500/20 bg-green-500/10">
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        <span className="text-sm font-bold text-green-400">Akun berhasil dibuat</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Role</span>
          <Badge variant="outline" className={`${meta.ring} ${meta.color} text-[10px] gap-1`}>
            {meta.icon}{meta.label}
          </Badge>
        </div>

        <CopyField label="Username" value={username} />
        <CopyField label="Password" value={password} />

        {/* WEB LOGIN */}
        <div className="rounded-lg border border-[#00b4ff]/25 bg-[#00b4ff]/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#00b4ff] font-bold">
            <Globe className="w-3 h-3" /> Web Login
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Masa aktif</span>
            <span className="text-white font-medium flex items-center gap-1">
              {permanent ? <InfinityIcon className="w-3.5 h-3.5 text-green-400" /> : <Clock className="w-3.5 h-3.5 text-[#00b4ff]" />}
              {expiredLabel}
            </span>
          </div>
          {!permanent && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Sisa</span>
              <span className="text-[#00b4ff] font-mono">{daysLeft} hari</span>
            </div>
          )}
          <div className="text-[10px] text-gray-500 leading-relaxed pt-1 border-t border-white/5">
            Login di halaman utama memakai username &amp; password di atas.
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full h-10 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs"
        >
          Tutup
        </Button>
      </div>
    </div>
  );
}

// ── Field form (di luar komponen agar tidak remount tiap ketikan) ──
function FormField({ label, icon, hint, children }: { label: string; icon: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
        {icon}{label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useListUsers();

  const createUser = useCreateUser();
  const banUser = useBanUser();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [created, setCreated] = useState<{ username: string; password: string; role: RoleType; expiredAt: string | null } | null>(null);

  const emptyForm = { username: "", password: "", role: "user" as RoleType, expiredDays: "30", note: "" };
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [editData, setEditData] = useState({ username: "", password: "", role: "user" as RoleType, expiredDays: "", note: "" });

  const computeExpiredAt = (days: string): string | null => {
    const n = parseInt(days, 10);
    if (!n || n <= 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  const resetCreate = () => {
    setFormData(emptyForm);
    setCreated(null);
    createUser.reset();
  };

  const handleCreate = () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      toast({ variant: "destructive", title: "Data belum lengkap", description: "Username dan password wajib diisi." });
      return;
    }
    if (formData.password.length < 6) {
      toast({ variant: "destructive", title: "Password terlalu pendek", description: "Minimal 6 karakter." });
      return;
    }
    const expiredAt = computeExpiredAt(formData.expiredDays);
    createUser.mutate(
      {
        data: {
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
          expiredAt: expiredAt ?? undefined,
          note: formData.note.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          // Jangan tutup dialog: tampilkan kartu hasil agar bisa disalin
          setCreated({
            username: formData.username.trim(),
            password: formData.password,
            role: formData.role,
            expiredAt,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Gagal membuat akun", description: err?.message || "Username mungkin sudah dipakai." });
        },
      }
    );
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditData({ username: u.username, password: "", role: (u.role as RoleType) ?? "user", expiredDays: "", note: u.note ?? "" });
    setIsEditOpen(true);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    const updates: any = {};
    if (editData.username && editData.username !== editTarget.username) updates.username = editData.username;
    if (editData.password) updates.password = editData.password;
    if (editData.role) updates.role = editData.role;
    if (editData.expiredDays) updates.expiredAt = computeExpiredAt(editData.expiredDays);
    if (editData.note !== undefined) updates.note = editData.note;

    updateUser.mutate(
      { id: editTarget.id, data: updates },
      {
        onSuccess: () => {
          toast({ title: "Perubahan disimpan", className: "bg-[#0a0e1a] text-white border-[#00b4ff]" });
          setIsEditOpen(false);
          setEditTarget(null);
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Gagal menyimpan", description: err?.message || "Coba lagi." });
        },
      }
    );
  };

  const handleBanToggle = (u: User) => {
    const isBanned = u.status === "banned";
    banUser.mutate(
      { id: u.id, data: { banned: !isBanned } },
      {
        onSuccess: () => {
          toast({ title: isBanned ? "User diaktifkan kembali" : "User diblokir", className: "bg-[#0a0e1a] text-white border-[#00b4ff]" });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
      }
    );
  };

  const handleDelete = (id: number, username: string) => {
    if (!confirm(`Hapus akun "${username}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    deleteUser.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Akun dihapus", className: "bg-[#0a0e1a] text-white border-[#00b4ff]" });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
      }
    );
  };

  const stats = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      active: list.filter((u) => u.status === "active").length,
      reseller: list.filter((u) => u.role === "reseller").length,
      admin: list.filter((u) => u.role === "admin").length,
    };
  }, [users]);

  const statusStyle = (status: string) => {
    if (status === "active") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (status === "banned") return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[#00b4ff] shrink-0" /> MANAJEMEN USER
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5">Buat dan kelola akun user, reseller, dan admin</p>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetCreate();
          }}
        >
          <DialogTrigger asChild>
            <Button className="cyber-button h-9 px-3 text-xs shrink-0">
              <Plus className="w-4 h-4 mr-1" /> BUAT AKUN
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white max-w-[400px] max-h-[90dvh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-5 pb-3 shrink-0 border-b border-white/10">
              <DialogTitle className="text-[#00b4ff] flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" /> {created ? "Akun Baru" : "Buat Akun Baru"}
              </DialogTitle>
            </DialogHeader>

            {created ? (
              <div className="p-5 overflow-y-auto min-h-0">
                <CreatedAccountCard
                  username={created.username}
                  password={created.password}
                  role={created.role}
                  expiredAt={created.expiredAt}
                  onClose={() => setIsCreateOpen(false)}
                />
              </div>
            ) : (
              <div className="flex flex-col min-h-0">
                <div className="space-y-4 py-1 px-6 pt-4 overflow-y-auto min-h-0">
                <FormField label="Username" icon={<UserIcon className="w-3 h-3" />}>
                  <Input
                    className="cyber-input h-10"
                    placeholder="contoh: budi01"
                    value={formData.username}
                    autoComplete="off"
                    autoCapitalize="none"
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </FormField>

                <FormField label="Password" icon={<Key className="w-3 h-3" />} hint="Minimal 6 karakter.">
                  <div className="relative">
                    <Input
                      className="cyber-input h-10 pr-10"
                      placeholder="Password akun"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      autoComplete="new-password"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </FormField>

                <FormField label="Role" icon={<Tag className="w-3 h-3" />}>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(ROLE_META) as RoleType[]).map((r) => {
                      const m = ROLE_META[r];
                      const active = formData.role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: r })}
                          className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] font-bold transition-all ${
                            active ? `${m.ring} ${m.color}` : "border-white/10 bg-black/30 text-gray-500 hover:border-white/25"
                          }`}
                        >
                          {m.icon}{m.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Masa aktif" icon={<Calendar className="w-3 h-3" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((p) => {
                      const active = formData.expiredDays === p.days;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, expiredDays: p.days })}
                          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            active
                              ? "border-[#00b4ff]/60 bg-[#00b4ff]/15 text-[#00b4ff]"
                              : "border-white/10 bg-black/30 text-gray-400 hover:border-white/25"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    className="cyber-input h-9 mt-2 text-xs"
                    type="number"
                    min={0}
                    placeholder="Atau isi jumlah hari sendiri (0 = permanen)"
                    value={formData.expiredDays}
                    onChange={(e) => setFormData({ ...formData, expiredDays: e.target.value })}
                  />
                </FormField>

                <FormField label="Catatan (opsional)" icon={<Tag className="w-3 h-3" />}>
                  <Input
                    className="cyber-input h-10"
                    placeholder="contoh: reseller area Bandung"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </FormField>

                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-white/10 bg-[#0a0e1a] shrink-0">
                  <Button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={createUser.isPending}
                    className="flex-1 cyber-button h-10 text-xs"
                  >
                    {createUser.isPending ? "Membuat..." : "Buat Akun"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Aktif", value: stats.active, color: "text-green-400" },
          { label: "Reseller", value: stats.reseller, color: "text-purple-400" },
          { label: "Admin", value: stats.admin, color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="cyber-card p-2.5 text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dialog edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white max-w-[400px] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#00b4ff] flex items-center gap-2 text-base">
              <Edit className="w-4 h-4" /> Edit: {editTarget?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <FormField label="Username" icon={<UserIcon className="w-3 h-3" />}>
              <Input className="cyber-input h-10" value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} />
            </FormField>
            <FormField label="Password baru" icon={<Key className="w-3 h-3" />} hint="Kosongkan jika tidak ingin mengubah.">
              <Input className="cyber-input h-10" placeholder="••••••" value={editData.password} onChange={(e) => setEditData({ ...editData, password: e.target.value })} />
            </FormField>
            <FormField label="Role" icon={<Tag className="w-3 h-3" />}>
              <Select value={editData.role} onValueChange={(v) => setEditData({ ...editData, role: v as RoleType })}>
                <SelectTrigger className="cyber-input w-full h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0a0e1a] border-[#00b4ff]/30 text-white">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Set ulang masa aktif" icon={<Calendar className="w-3 h-3" />} hint="Isi 0 untuk permanen. Kosongkan untuk membiarkan.">
              <Input className="cyber-input h-10" type="number" min={0} placeholder="jumlah hari" value={editData.expiredDays} onChange={(e) => setEditData({ ...editData, expiredDays: e.target.value })} />
            </FormField>
            <FormField label="Catatan" icon={<Tag className="w-3 h-3" />}>
              <Input className="cyber-input h-10" value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} />
            </FormField>
            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs">
                Batal
              </Button>
              <Button type="button" onClick={handleEdit} disabled={updateUser.isPending} className="flex-1 cyber-button h-10 text-xs">
                {updateUser.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daftar user */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="text-center text-gray-500 py-10 text-sm">
            <div className="w-8 h-8 border-2 border-[#00b4ff]/30 border-t-[#00b4ff] rounded-full animate-spin mx-auto mb-3" />
            Memuat data...
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-sm">Belum ada akun</div>
        ) : (
          users.map((u) => {
            const meta = ROLE_META[(u.role as RoleType) ?? "user"];
            const permanent = !u.expiredAt;
            const expired = u.expiredAt ? new Date(u.expiredAt) : null;
            const daysLeft = expired ? Math.max(0, Math.ceil((expired.getTime() - Date.now()) / 86400000)) : null;

            return (
              <div key={u.id} className="cyber-card p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.ring} ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                        {u.username}
                        {u.role === "admin" && <Shield className="w-3 h-3 text-yellow-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{u.note || "—"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`${meta.ring} ${meta.color} text-[9px] uppercase`}>{meta.label}</Badge>
                    <Badge variant="outline" className={`${statusStyle(u.status ?? "active")} text-[9px] uppercase`}>{u.status}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] border-t border-white/5 pt-2">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Masa aktif
                  </span>
                  <span className="text-white flex items-center gap-1">
                    {permanent ? (
                      <><InfinityIcon className="w-3 h-3 text-green-400" /> Permanen</>
                    ) : (
                      <>{expired!.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        <span className="text-gray-500">({daysLeft}h)</span></>
                    )}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => openEdit(u)}
                    className="flex-1 h-8 bg-black/40 border-[#00b4ff]/30 text-[#00b4ff] hover:bg-[#00b4ff]/15 text-[11px]">
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBanToggle(u)}
                    className="flex-1 h-8 bg-black/40 border-orange-500/30 text-orange-400 hover:bg-orange-500/15 text-[11px]">
                    <Ban className="w-3 h-3 mr-1" /> {u.status === "banned" ? "Aktifkan" : "Blokir"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(u.id, u.username)}
                    className="h-8 w-8 bg-black/40 border-red-500/30 text-red-500 hover:bg-red-500/15 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
