/**
 * Script untuk memperbaiki / mengatur ulang password admin di MongoDB.
 *
 * Backend VINCENT WORLD MULTI memakai MongoDB (Mongoose), bukan PostgreSQL.
 * Hash yang dipakai: SHA256(password + "pvincent_salt_2025")
 *
 * Cara pakai:
 *   MONGODB_URI="mongodb+srv://..." node scripts/fix-admin-password.mjs
 *
 * Catatan: cara paling mudah adalah memanggil endpoint seed sekali saja:
 *   GET https://<domain-kamu>/api/seed-admin?secret=vw_seed_2026
 */

import crypto from "node:crypto";
import mongoose from "mongoose";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "#FFHUDT6O3jiQiSWxPo7eO";
const SALT = "pvincent_salt_2025";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password + SALT).digest("hex");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI belum diisi.");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: "vincent_world" });
  const users = mongoose.connection.collection("users");

  const password_hash = hashPassword(ADMIN_PASSWORD);
  const existing = await users.findOne({ username: ADMIN_USERNAME });

  if (existing) {
    await users.updateOne(
      { username: ADMIN_USERNAME },
      { $set: { password_hash, role: "admin", status: "active" } },
    );
    console.log(`✅ Password admin (${ADMIN_USERNAME}) berhasil diperbarui.`);
  } else {
    await users.insertOne({
      username: ADMIN_USERNAME,
      password_hash,
      role: "admin",
      status: "active",
      expired_at: null,
      note: "Admin Utama VINCENT WORLD MULTI",
      last_login: null,
      created_at: new Date(),
    });
    console.log(`✅ User admin (${ADMIN_USERNAME}) berhasil dibuat.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal memperbarui password admin:", err.message);
  process.exit(1);
});
