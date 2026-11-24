import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "../..");

await build({
  entryPoints: [path.resolve(artifactDir, "src/index.ts")],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile: path.resolve(repoRoot, "api/index.js"),
  logLevel: "info",
  external: [
    "*.node", "sharp", "better-sqlite3", "sqlite3", "canvas",
    "bcrypt", "argon2", "fsevents", "pg-native", "pino-pretty",
    "@swc/*",
    // thread-stream intentionally NOT external — pino's transport loader
    // requires it at the top of its module on first request even without a
    // configured transport, so it must be bundled to avoid MODULE_NOT_FOUND.
  ],
  define: {
    "import.meta.url": '"file://"',
    // Force production mode so pino never launches pino-pretty transport
    "process.env.NODE_ENV": '"production"',
  },
  // Vercel serverless needs module.exports = expressApp (not { default: expressApp })
  footer: {
    js: 'if (module.exports && typeof module.exports.default === "function") { module.exports = module.exports.default; }',
  },
});

console.log("✅ Built api/index.js (CJS)");
