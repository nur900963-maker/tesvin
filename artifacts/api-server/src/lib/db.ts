import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

// ── Supabase client (server-side) ────────────────────────────────────────────
// ENV yang dibaca (urutan prioritas):
//   URL : SUPABASE_URL                 → fallback VITE_SUPABASE_URL
//   KEY : SUPABASE_SERVICE_ROLE_KEY    → fallback SUPABASE_ANON_KEY → VITE_SUPABASE_ANON_KEY
// Service-role key = akses penuh & RLS bisa diaktifkan (disarankan).
// Anon key = tetap jalan, TAPI tabel users/activity_logs/tools_usage harus
// RLS-nonaktif (default migration 00001), artinya siapa pun yang memegang
// URL+anon key bisa baca tabel (termasuk password_hash). Jangan taruh anon key
// di kode frontend.
let _client: SupabaseClient | null = null;


function resolveEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const key = service || anon;
  return { url, key, mode: (service ? "service_role" : "anon") as "service_role" | "anon" };
}

export function dbKeyMode(): "service_role" | "anon" | "none" {
  const { url, key, mode } = resolveEnv();
  return url && key ? mode : "none";
}

export function getDb(): SupabaseClient {
  if (_client) return _client;
  const { url, key, mode } = resolveEnv();
  if (!url || !key) {
    throw new Error(
      "Supabase belum dikonfigurasi: isi SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY",
    );
  }
  if (mode === "anon") {
    logger.warn("Supabase memakai ANON key (SUPABASE_SERVICE_ROLE_KEY tidak diset). Pastikan RLS nonaktif; disarankan pakai service-role key.");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// ── Types (sesuai supabase/migrations/00001_create_schema.sql) ───────────────
export type UserRole = "admin" | "reseller" | "user";
export type UserStatus = "active" | "banned" | "expired";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  expired_at: string | null;
  note: string | null;
  last_login: string | null;
  created_at: string;
}

export interface LogRow {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  detail: string | null;
  ip: string | null;
  created_at: string;
}

// Kolom TIMESTAMP (tanpa timezone) dikembalikan PostgREST tanpa suffix "Z".
// Server berjalan di UTC, jadi tandai sebagai UTC supaya browser tidak salah baca.
export function toIso(v: string | null | undefined): string | null {
  if (!v) return null;
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(v) ? v : `${v}Z`;
}

export function formatUser(u: UserRow) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    expiredAt: toIso(u.expired_at),
    createdAt: toIso(u.created_at),
    lastLogin: toIso(u.last_login),
    note: u.note ?? null,
  };
}

export function formatLog(l: LogRow) {
  return {
    id: l.id,
    userId: l.user_id,
    username: l.username,
    action: l.action,
    detail: l.detail,
    ip: l.ip,
    createdAt: toIso(l.created_at),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toIntId(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export { toIntId };

// Logging tidak boleh membuat request utama gagal: error hanya di-log.
export async function insertLog(data: {
  userId?: number | string | null;
  username?: string | null;
  action: string;
  detail?: string | null;
  ip?: string | null;
}): Promise<void> {
  try {
    const { error } = await getDb().from("activity_logs").insert({
      user_id: toIntId(data.userId),
      username: data.username ?? null,
      action: data.action,
      detail: data.detail ?? null,
      ip: data.ip ?? null,
    });
    if (error) logger.error({ err: error }, "insertLog gagal");
  } catch (err) {
    logger.error({ err }, "insertLog exception");
  }
}

export async function insertToolUsage(
  userId: number | string,
  toolId: string,
  toolName: string,
): Promise<void> {
  try {
    const { error } = await getDb().from("tools_usage").insert({
      user_id: toIntId(userId),
      tool_id: toolId,
      tool_name: toolName,
    });
    if (error) logger.error({ err: error }, "insertToolUsage gagal");
  } catch (err) {
    logger.error({ err }, "insertToolUsage exception");
  }
}
