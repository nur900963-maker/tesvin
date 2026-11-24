import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const logsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  username: text("username"),
  action: text("action").notNull(),
  detail: text("detail"),
  ip: text("ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ActivityLog = typeof logsTable.$inferSelect;
