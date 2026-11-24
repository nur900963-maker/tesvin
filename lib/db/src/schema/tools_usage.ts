import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const toolsUsageTable = pgTable("tools_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  toolId: text("tool_id").notNull(),
  toolName: text("tool_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ToolUsage = typeof toolsUsageTable.$inferSelect;
