import { Router } from "express";
import { getDb, insertLog, formatUser, toIntId, type UserRow } from "../lib/db";
import { logger } from "../lib/logger";
import { verifyToken, hashPassword } from "./auth";

const router = Router();

const ROLES = ["admin", "reseller", "user"];
const STATUSES = ["active", "banned", "expired"];

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

function parseDate(v: string | null | undefined): string | null | "invalid" {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? "invalid" : d.toISOString();
}

router.get("/users", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;
  try {
    const { data, error } = await getDb().from("users").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    res.json((data as UserRow[]).map(formatUser));
  } catch (err) {
    logger.error({ err }, "GET /users error");
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.post("/users", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const { username, password, role, expiredAt, note } = (req.body ?? {}) as {
    username?: string; password?: string; role?: string; expiredAt?: string; note?: string;
  };

  if (!username || !password || !role) {
    res.status(400).json({ error: "Username, password and role required" });
    return;
  }
  if (!ROLES.includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const exp = parseDate(expiredAt);
  if (exp === "invalid") {
    res.status(400).json({ error: "Invalid expiredAt" });
    return;
  }

  try {
    const { data, error } = await getDb()
      .from("users")
      .insert({
        username: username.trim(),
        password_hash: hashPassword(password),
        role,
        status: "active",
        expired_at: exp,
        note: note ?? null,
      })
      .select("*")
      .single();

    if (error) {
      // 23505 = unique_violation (username sudah ada)
      if (error.code === "23505") {
        res.status(400).json({ error: "Username already exists" });
        return;
      }
      throw error;
    }

    await insertLog({ userId: actor.userId, username: actor.username, action: "CREATE_USER", detail: `Created user: ${username} (role: ${role})` });
    res.status(201).json(formatUser(data as UserRow));
  } catch (err) {
    logger.error({ err }, "POST /users error");
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/users/:id", async (req, res) => {
  const actor = requireAuth(req, res);
  if (!actor) return;

  const id = toIntId(req.params.id);
  if (id === null) { res.status(404).json({ error: "User not found" }); return; }
  if (actor.role !== "admin" && String(actor.userId) !== String(id)) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { data, error } = await getDb().from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(data as UserRow));
  } catch (err) {
    logger.error({ err }, "GET /users/:id error");
    res.status(500).json({ error: "Failed to load user" });
  }
});

router.patch("/users/:id", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const id = toIntId(req.params.id);
  if (id === null) { res.status(404).json({ error: "User not found" }); return; }

  const { username, password, role, status, expiredAt, note } = (req.body ?? {}) as {
    username?: string; password?: string; role?: string; status?: string; expiredAt?: string | null; note?: string | null;
  };

  const updates: Record<string, unknown> = {};
  if (username) updates.username = username.trim();
  if (password) updates.password_hash = hashPassword(password);
  if (role) {
    if (!ROLES.includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
    updates.role = role;
  }
  if (status) {
    if (!STATUSES.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    updates.status = status;
  }
  if (expiredAt !== undefined) {
    const exp = parseDate(expiredAt);
    if (exp === "invalid") { res.status(400).json({ error: "Invalid expiredAt" }); return; }
    updates.expired_at = exp;
  }
  if (note !== undefined) updates.note = note;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  try {
    const { data, error } = await getDb().from("users").update(updates).eq("id", id).select("*").maybeSingle();
    if (error) {
      if (error.code === "23505") { res.status(400).json({ error: "Username already exists" }); return; }
      throw error;
    }
    if (!data) { res.status(404).json({ error: "User not found" }); return; }

    await insertLog({ userId: actor.userId, username: actor.username, action: "UPDATE_USER", detail: `Updated user ID: ${id}` });
    res.json(formatUser(data as UserRow));
  } catch (err) {
    logger.error({ err }, "PATCH /users/:id error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const id = toIntId(req.params.id);
  if (id === null) { res.status(404).json({ error: "User not found" }); return; }

  try {
    const { data, error } = await getDb().from("users").delete().eq("id", id).select("username").maybeSingle();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "User not found" }); return; }

    await insertLog({ userId: actor.userId, username: actor.username, action: "DELETE_USER", detail: `Deleted user: ${data.username}` });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /users/:id error");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.post("/users/:id/ban", async (req, res) => {
  const actor = requireAdmin(req, res);
  if (!actor) return;

  const id = toIntId(req.params.id);
  if (id === null) { res.status(404).json({ error: "User not found" }); return; }

  const { banned } = (req.body ?? {}) as { banned?: boolean };
  const newStatus = banned ? "banned" : "active";

  try {
    const { data, error } = await getDb().from("users").update({ status: newStatus }).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "User not found" }); return; }

    await insertLog({ userId: actor.userId, username: actor.username, action: banned ? "BAN_USER" : "UNBAN_USER", detail: `${banned ? "Banned" : "Unbanned"} user: ${(data as UserRow).username}` });
    res.json(formatUser(data as UserRow));
  } catch (err) {
    logger.error({ err }, "POST /users/:id/ban error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
