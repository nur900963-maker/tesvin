
-- Drop tables if exist (idempotent)
DROP TABLE IF EXISTS "tools_usage" CASCADE;
DROP TABLE IF EXISTS "activity_logs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "role" CASCADE;
DROP TYPE IF EXISTS "user_status" CASCADE;

-- Create enums
CREATE TYPE "role" AS ENUM ('admin', 'reseller', 'user');
CREATE TYPE "user_status" AS ENUM ('active', 'banned', 'expired');

-- Create users table
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" "role" NOT NULL DEFAULT 'user',
  "status" "user_status" NOT NULL DEFAULT 'active',
  "expired_at" TIMESTAMP,
  "note" TEXT,
  "last_login" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "username" TEXT,
  "action" TEXT NOT NULL,
  "detail" TEXT,
  "ip" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create tools_usage table
CREATE TABLE "tools_usage" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "tool_id" TEXT NOT NULL,
  "tool_name" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default admin user
-- password_hash = bcrypt of '#FFHUDT6O3jiQiSWxPo7eO' (placeholder, will need to be set properly)
INSERT INTO "users" ("username", "password_hash", "role", "status")
VALUES ('admin', '2f58ecd66c1dc28ab003295a2476c3325af31de92aef900eaf729291c5d3394d', 'admin', 'active')
ON CONFLICT ("username") DO UPDATE SET password_hash = EXCLUDED.password_hash, status = EXCLUDED.status;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON "activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON "activity_logs"("created_at");
CREATE INDEX IF NOT EXISTS idx_tools_usage_user_id ON "tools_usage"("user_id");
CREATE INDEX IF NOT EXISTS idx_tools_usage_tool_id ON "tools_usage"("tool_id");
