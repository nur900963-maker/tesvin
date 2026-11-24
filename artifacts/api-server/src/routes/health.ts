import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getDb, dbKeyMode } from "../lib/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Cek koneksi + tabel Supabase (tidak membocorkan data/secret)
router.get("/healthz/db", async (_req, res) => {
  const mode = dbKeyMode();
  if (mode === "none") {
    res.status(500).json({ ok: false, keyMode: mode, error: "Env Supabase belum diisi" });
    return;
  }
  try {
    const { error, count } = await getDb().from("users").select("*", { count: "exact", head: true });
    if (error) {
      res.status(500).json({ ok: false, keyMode: mode, error: error.message, code: error.code ?? null, hint: "Jika 'relation ... does not exist' jalankan supabase/migrations/00001_create_schema.sql di SQL Editor" });
      return;
    }
    res.json({ ok: true, keyMode: mode, usersCount: count ?? 0 });
  } catch (err: any) {
    res.status(500).json({ ok: false, keyMode: mode, error: err?.message ?? "DB error" });
  }
});

export default router;
