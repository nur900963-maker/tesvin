"use strict";
// DEPLOY_MARKER_v7_STANDALONE_NO_DEPS
module.exports = function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({
    ok: true,
    marker: "v7",
    node: process.version,
    env: process.env.NODE_ENV,
    hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    keyMode: process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon",
    hasSessionSecret: !!process.env.SESSION_SECRET,
  }));
};
