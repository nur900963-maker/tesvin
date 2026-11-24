import { Router } from "express";
import { connectDB, LogModel } from "../lib/db";
import { verifyToken } from "./auth";

const router = Router();

router.get("/logs", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") { res.status(403).json({ error: "Admin required" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const userId = req.query.userId ? req.query.userId as string : undefined;

  await connectDB();
  const query: any = {};
  if (userId) query.username = userId;

  const logs = await LogModel.find(query).sort({ created_at: -1 }).limit(limit);

  res.json(logs.map((l) => ({
    id: l._id.toString(),
    userId: l.user_id,
    username: l.username,
    action: l.action,
    detail: l.detail,
    ip: l.ip,
    createdAt: l.created_at,
  })));
});

export default router;
