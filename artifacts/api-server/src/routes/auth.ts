import { Router } from "express";
import { getDb, insertLog, formatUser, toIntId, type UserRow } from "../lib/db";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "pvincent_salt_2025").digest("hex");
}

export function generateToken(userId: string | number, username: string, role: string): string {
  const payload = JSON.stringify({ userId: String(userId), username, role, ts: Date.now() });
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
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  try {
    const db = getDb();
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;
    const user = data as UserRow | null;

    if (!user || user.password_hash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (user.status === "banned") {
      res.status(403).json({ error: "Account is banned" });
      return;
    }

    if (user.expired_at) {
      // Kolom TIMESTAMP tanpa tz → anggap UTC
      const exp = new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(user.expired_at) ? user.expired_at : `${user.expired_at}Z`);
      if (exp < new Date()) {
        await db.from("users").update({ status: "expired" }).eq("id", user.id);
        res.status(403).json({ error: "Account has expired" });
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const { error: updErr } = await db.from("users").update({ last_login: nowIso }).eq("id", user.id);
    if (updErr) logger.error({ err: updErr }, "update last_login gagal");

    await insertLog({
      userId: user.id,
      username: user.username,
      action: "LOGIN",
      detail: `User ${user.username} logged in`,
      ip: req.ip || "unknown",
    });

    const token = generateToken(user.id, user.username, user.role);

    res.json({
      user: formatUser({ ...user, last_login: nowIso }),
      token,
    });
  } catch (err) {
    logger.error({ err }, "login error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (decoded) {
      await insertLog({
        userId: decoded.userId,
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

  const id = toIntId(decoded.userId);
  if (id === null) {
    // Token lama (format ObjectId MongoDB) tidak valid lagi → login ulang
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const { data, error } = await getDb().from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(data as UserRow));
  } catch (err) {
    logger.error({ err }, "auth/me error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
