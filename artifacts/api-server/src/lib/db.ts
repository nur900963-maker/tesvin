import mongoose, { Schema, model, Document, Model } from "mongoose";

// ── Connection ────────────────────────────────────────────────────────────────
let _connected = false;

export async function connectDB(): Promise<void> {
  if (_connected || mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");
  await mongoose.connect(uri, { dbName: "vincent_world" });
  _connected = true;
}

// ── User ─────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password_hash: string;
  role: "admin" | "reseller" | "user";
  status: "active" | "banned" | "expired";
  expired_at: Date | null;
  note: string | null;
  last_login: Date | null;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  username:      { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ["admin","reseller","user"], default: "user" },
  status:        { type: String, enum: ["active","banned","expired"], default: "active" },
  expired_at:    { type: Date, default: null },
  note:          { type: String, default: null },
  last_login:    { type: Date, default: null },
  created_at:    { type: Date, default: () => new Date() },
});

export const UserModel: Model<IUser> =
  mongoose.models.User || model<IUser>("User", UserSchema);

// ── Activity Log ─────────────────────────────────────────────────────────────
export interface ILog extends Document {
  user_id: string | null;
  username: string | null;
  action: string;
  detail: string | null;
  ip: string | null;
  created_at: Date;
}

const LogSchema = new Schema<ILog>({
  user_id:  { type: String, default: null },
  username: { type: String, default: null },
  action:   { type: String, required: true },
  detail:   { type: String, default: null },
  ip:       { type: String, default: null },
  created_at: { type: Date, default: () => new Date() },
});

export const LogModel: Model<ILog> =
  mongoose.models.ActivityLog || model<ILog>("ActivityLog", LogSchema);

// ── Tool Usage ────────────────────────────────────────────────────────────────
export interface IToolUsage extends Document {
  user_id: string | null;
  tool_id: string;
  tool_name: string;
  created_at: Date;
}

const ToolUsageSchema = new Schema<IToolUsage>({
  user_id:   { type: String, default: null },
  tool_id:   { type: String, required: true },
  tool_name: { type: String, required: true },
  created_at: { type: Date, default: () => new Date() },
});

export const ToolUsageModel: Model<IToolUsage> =
  mongoose.models.ToolUsage || model<IToolUsage>("ToolUsage", ToolUsageSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
export async function insertLog(data: {
  userId?: number | null;
  username?: string | null;
  action: string;
  detail?: string | null;
  ip?: string | null;
}) {
  await connectDB();
  await LogModel.create({
    user_id: data.userId ?? null,
    username: data.username ?? null,
    action: data.action,
    detail: data.detail ?? null,
    ip: data.ip ?? null,
  });
}

export async function insertToolUsage(userId: number, toolId: string, toolName: string) {
  await connectDB();
  await ToolUsageModel.create({ user_id: userId, tool_id: toolId, tool_name: toolName });
}
