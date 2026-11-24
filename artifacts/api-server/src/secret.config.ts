// ================================================================
// SECRET CONFIG — semua setting server ada di SINI (tanpa env Vercel).
// File ini ikut ter-bundle ke backend (api/index.js), TIDAK dikirim ke browser.
// ⚠️ Isinya rahasia: repo GitHub WAJIB Private. Jangan share file ini.
// Prioritas: nilai di file ini → kalau kosong baru baca env Vercel.
// ================================================================
export const SECRET = {
  // Supabase (project dari env lama)
  SUPABASE_URL: "https://esitvrwkdppauvwkkxeg.supabase.co",
  // Isi anon key ATAU service-role key (service-role lebih disarankan)
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaXR2cndrZHBwYXV2d2treGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDU4MzIsImV4cCI6MjA5NzgyMTgzMn0.bbJXfRIeFi04kd9uYtVCsTKHeu-IQsK4ltvGrycGyMk",

  // Penanda tangan token login
  SESSION_SECRET: "VincentWorldSecretKey2026_ChangeThisRandomly",
};

export function sessionSecret(): string {
  return SECRET.SESSION_SECRET || process.env.SESSION_SECRET || "pvincent_secret_2025";
}
