import { Router } from "express";
import { connectDB, UserModel } from "../lib/db";
import { hashPassword } from "./auth";

const router = Router();

// One-time admin seed endpoint — creates/fixes admin user
// Protected by secret param: /api/seed-admin?secret=vw_seed_2026
router.get("/seed-admin", async (req, res) => {
  const { secret } = req.query;
  if (secret !== "vw_seed_2026") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    await connectDB();
    const adminPassword = "#FFHUDT6O3jiQiSWxPo7eO";
    const adminHash = hashPassword(adminPassword);

    const existing = await UserModel.findOne({ username: "admin" });

    if (!existing) {
      const user = await UserModel.create({
        username: "admin",
        password_hash: adminHash,
        role: "admin",
        status: "active",
      });
      res.json({ ok: true, action: "inserted", id: user._id.toString() });
    } else {
      await UserModel.updateOne({ username: "admin" }, { password_hash: adminHash, status: "active", role: "admin" });
      res.json({
        ok: true,
        action: "updated",
        id: existing._id.toString(),
        hash_was_correct: existing.password_hash === adminHash,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
