import { Router } from "express";
import { getDb } from "../lib/db";
import { logger } from "../lib/logger";
import { hashPassword } from "./auth";

const router = Router();

// One-time admin seed endpoint — creates/fixes admin user
// Protected by secret param: /api/seed-admin?secret=vw_seed_2026
// (kredensial admin utama TIDAK diubah)
router.get("/seed-admin", async (req, res) => {
  const { secret } = req.query;
  if (secret !== "vw_seed_2026") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const db = getDb();
    const adminPassword = "#FFHUDT6O3jiQiSWxPo7eO";
    const adminHash = hashPassword(adminPassword);

    const { data: existing, error: findErr } = await db
      .from("users")
      .select("id, password_hash")
      .eq("username", "admin")
      .maybeSingle();
    if (findErr) throw findErr;

    if (!existing) {
      const { data, error } = await db
        .from("users")
        .insert({ username: "admin", password_hash: adminHash, role: "admin", status: "active" })
        .select("id")
        .single();
      if (error) throw error;
      res.json({ ok: true, action: "inserted", id: data.id });
    } else {
      const { error } = await db
        .from("users")
        .update({ password_hash: adminHash, status: "active", role: "admin" })
        .eq("username", "admin");
      if (error) throw error;
      res.json({
        ok: true,
        action: "updated",
        id: existing.id,
        hash_was_correct: existing.password_hash === adminHash,
      });
    }
  } catch (err: any) {
    logger.error({ err }, "seed-admin error");
    res.status(500).json({ error: err?.message ?? "Seed failed" });
  }
});

export default router;
