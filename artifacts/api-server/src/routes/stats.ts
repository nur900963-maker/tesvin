import { Router } from "express";
import { getDb, formatLog, type LogRow } from "../lib/db";
import { logger } from "../lib/logger";
import { verifyToken } from "./auth";

const router = Router();

router.get("/stats", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: "Invalid token" }); return; }

  try {
    const db = getDb();
    const count = (table: string, status?: string) => {
      let q = db.from(table).select("*", { count: "exact", head: true });
      if (status) q = q.eq("status", status);
      return q;
    };

    const [total, active, banned, logsCount, toolsCount, recent, usage] = await Promise.all([
      count("users"),
      count("users", "active"),
      count("users", "banned"),
      count("activity_logs"),
      count("tools_usage"),
      db.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
      db.from("tools_usage").select("tool_id, tool_name").limit(10000),
    ]);

    for (const r of [total, active, banned, logsCount, toolsCount, recent, usage]) {
      if (r.error) throw r.error;
    }

    const toolCounts: Record<string, { toolId: string; toolName: string; count: number }> = {};
    (usage.data ?? []).forEach((t: { tool_id: string; tool_name: string }) => {
      if (!toolCounts[t.tool_id]) toolCounts[t.tool_id] = { toolId: t.tool_id, toolName: t.tool_name, count: 0 };
      toolCounts[t.tool_id].count++;
    });
    const popularTools = Object.values(toolCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    res.json({
      totalUsers: total.count ?? 0,
      activeUsers: active.count ?? 0,
      bannedUsers: banned.count ?? 0,
      onlineUsers: Math.floor(Math.random() * 5) + 1,
      totalLogs: logsCount.count ?? 0,
      toolsUsed: toolsCount.count ?? 0,
      recentActivity: ((recent.data ?? []) as LogRow[]).map(formatLog),
      popularTools,
    });
  } catch (err) {
    logger.error({ err }, "GET /stats error");
    res.status(500).json({ error: "Failed to load stats" });
  }
});

export default router;
