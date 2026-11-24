/**
 * Script untuk memperbaiki password admin yang salah di database.
 * Jalankan ini jika database sudah terdeploy dengan hash bcrypt placeholder.
 *
 * Cara pakai:
 *   DATABASE_URL=... npx tsx scripts/fix-admin-password.ts
 */

import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Memperbaiki password admin...");

  const [user] = await db
    .update(usersTable)
    .set({
      passwordHash:
        "2f58ecd66c1dc28ab003295a2476c3325af31de92aef900eaf729291c5d3394d",
    })
    .where(eq(usersTable.username, "admin"))
    .returning();

  if (user) {
    console.log(`✅ Password admin (${user.username}) berhasil diperbarui.`);
  } else {
    console.log("⚠️  User admin tidak ditemukan. Pastikan migration sudah dijalankan.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal memperbarui password admin:", err);
  process.exit(1);
});
