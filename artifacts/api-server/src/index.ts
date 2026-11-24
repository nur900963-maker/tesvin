import app from "./app";

// Support both ESM (dev) and CJS (Vercel serverless bundle)
export default app;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).module !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).module.exports = app;
}
