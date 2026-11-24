import { Router } from "express";
import { connectDB, UserModel, insertLog } from "../lib/db";
import { verifyToken, hashPassword } from "./auth";

const router = Router();

function requireAdmin(req: any, res: any): { userId: string; username: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return null; }
  return decoded;
}

function requireAuth(req: any, res: any): { userId: string; username: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: "Invalid token" }); return null; }
  return decoded;
}

function formatUser(user: any) {
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    status: user.status,
    expiredAt: user.expired_at ?? null,
    createdAt: user.created_at,
    lastLogin: user.last_login ?? null,
    note: user.note ?? null,
  };
}

router.get("/users", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;
  await connectDB();
  const users = await UserModel.find().sort({ created_at: 1 });
  res.json(users.map(formatUser));
});

router.post("/users", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const { username, password, role, expiredAt, note } = req.body as {
    username: string; password: string; role: string; expiredAt?: string; note?: string;
  };

  if (!username || !password || !role) {
    res.status(400).json({ error: "Username, password and role required" });
    return;
  }

  await connectDB();
  try {
    // Cek eksplisit: index unik MongoDB bisa belum terbangun pada
    // deployment baru, sehingga duplikat lolos. Jangan bergantung
    // hanya pada error 11000.
    const existing = await UserModel.findOne({ username: username.trim() });
    if (existing) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    const user = await UserModel.create({
      username: username.trim(),
      password_hash: hashPassword(password),
      role,
      status: "active",
      expired_at: expiredAt ? new Date(expiredAt) : null,
      note: note ?? null,
    });
    await insertLog({ username: actor.username, action: "CREATE_USER", detail: `Created user: ${username} (role: ${role})` });
    res.status(201).json(formatUser(user));
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
});

router.get("/users/:id", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  await connectDB();
  const user = await UserModel.findById(req.params.id).catch(() => null);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (actor.role !== "admin" && actor.userId !== req.params.id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(formatUser(user));
});

router.patch("/users/:id", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const { username, password, role, status, expiredAt, note } = req.body as {
    username?: string; password?: string; role?: string; status?: string; expiredAt?: string | null; note?: string | null;
  };

  const updates: any = {};
  if (username) updates.username = username;
  if (password) updates.password_hash = hashPassword(password);
  if (role) updates.role = role;
  if (status) updates.status = status;
  if (expiredAt !== undefined) updates.expired_at = expiredAt ? new Date(expiredAt) : null;
  if (note !== undefined) updates.note = note;

  await connectDB();
  const user = await UserModel.findByIdAndUpdate(req.params.id, updates, { new: true }).catch(() => null);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await insertLog({ username: actor.username, action: "UPDATE_USER", detail: `Updated user ID: ${req.params.id}` });
  res.json(formatUser(user));
});

router.delete("/users/:id", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  await connectDB();
  const user = await UserModel.findByIdAndDelete(req.params.id).catch(() => null);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await insertLog({ username: actor.username, action: "DELETE_USER", detail: `Deleted user: ${user.username}` });
  res.json({ success: true });
});

router.post("/users/:id/ban", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const { banned } = req.body as { banned: boolean };
  const newStatus = banned ? "banned" : "active";

  await connectDB();
  const user = await UserModel.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true }).catch(() => null);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await insertLog({ username: actor.username, action: banned ? "BAN_USER" : "UNBAN_USER", detail: `${banned ? "Banned" : "Unbanned"} user: ${user.username}` });
  res.json(formatUser(user));
});

export default router;
