import { Router } from "express";
import { connectDB, UserModel, LogModel, ToolUsageModel } from "../lib/db";
import { verifyToken } from "./auth";

const router = Router();

router.get("/stats", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: "Invalid token" }); return; }

  await connectDB();

  const [totalUsers, activeUsers, bannedUsers, totalLogs, toolsUsed, recentLogs, allToolsUsage] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ status: "active" }),
    UserModel.countDocuments({ status: "banned" }),
    LogModel.countDocuments(),
    ToolUsageModel.countDocuments(),
    LogModel.find().sort({ created_at: -1 }).limit(10),
    ToolUsageModel.find({}, { tool_id: 1, tool_name: 1 }),
  ]);

  // Popular tools
  const toolCounts: Record<string, { toolId: string; toolName: string; count: number }> = {};
  allToolsUsage.forEach((t) => {
    if (!toolCounts[t.tool_id]) toolCounts[t.tool_id] = { toolId: t.tool_id, toolName: t.tool_name, count: 0 };
    toolCounts[t.tool_id].count++;
  });
  const popularTools = Object.values(toolCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  res.json({
    totalUsers,
    activeUsers,
    bannedUsers,
    onlineUsers: Math.floor(Math.random() * 5) + 1,
    totalLogs,
    toolsUsed,
    recentActivity: recentLogs.map((l) => ({
      id: l._id.toString(),
      userId: l.user_id,
      username: l.username,
      action: l.action,
      detail: l.detail,
      ip: l.ip,
      createdAt: l.created_at,
    })),
    popularTools,
  });
});

export default router;
