import { Router } from "express";
import { connectDB, UserModel, insertLog } from "../lib/db";
import crypto from "crypto";

const router = Router();

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "pvincent_salt_2025").digest("hex");
}

export function generateToken(userId: string, username: string, role: string): string {
  const payload = JSON.stringify({ userId, username, role, ts: Date.now() });
  const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET || "pvincent_secret_2025")
    .update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64");
}

export function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, "base64").toString());
    const expected = crypto.createHmac("sha256", process.env.SESSION_SECRET || "pvincent_secret_2025")
      .update(payload).digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  await connectDB();
  const user = await UserModel.findOne({ username });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.password_hash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "banned") {
    res.status(403).json({ error: "Account is banned" });
    return;
  }

  if (user.expired_at && new Date(user.expired_at) < new Date()) {
    await UserModel.updateOne({ _id: user._id }, { status: "expired" });
    res.status(403).json({ error: "Account has expired" });
    return;
  }

  await UserModel.updateOne({ _id: user._id }, { last_login: new Date() });

  await insertLog({
    username: user.username,
    action: "LOGIN",
    detail: `User ${user.username} logged in`,
    ip: req.ip || "unknown",
  });

  const token = generateToken(user._id.toString(), user.username, user.role);

  res.json({
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      status: user.status,
      expiredAt: user.expired_at ?? null,
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
      note: user.note ?? null,
    },
    token,
  });
});

router.post("/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (decoded) {
      await insertLog({
        username: decoded.username,
        action: "LOGOUT",
        detail: `User ${decoded.username} logged out`,
        ip: req.ip || "unknown",
      });
    }
  }
  res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  await connectDB();
  const user = await UserModel.findById(decoded.userId);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    status: user.status,
    expiredAt: user.expired_at ?? null,
    createdAt: user.created_at,
    lastLogin: user.last_login ?? null,
    note: user.note ?? null,
  });
});

export default router;
