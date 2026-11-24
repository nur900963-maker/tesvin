import { Router } from "express";
import { getDb, formatLog, type LogRow } from "../lib/db";
import { logger } from "../lib/logger";
import { verifyToken } from "./auth";

const router = Router();

router.get("/logs", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") { res.status(403).json({ error: "Admin required" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const userId = req.query.userId ? String(req.query.userId) : undefined;

  try {
    // Perilaku lama: parameter userId memfilter berdasarkan username
    let q = getDb().from("activity_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (userId) q = q.eq("username", userId);
    const { data, error } = await q;
    if (error) throw error;
    res.json((data as LogRow[]).map(formatLog));
  } catch (err) {
    logger.error({ err }, "GET /logs error");
    res.status(500).json({ error: "Failed to load logs" });
  }
});

export default router;
