import { Router } from "express";
import { insertLog } from "../lib/db";
import { verifyToken } from "./auth";

const router = Router();

router.post("/siputzx", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  const { path, query } = req.body as { path: string; query?: Record<string, string> };
  if (!path) {
    res.status(400).json({ success: false, error: "Path is required" });
    return;
  }

  try {
    const url = new URL(path.startsWith('http') ? path : `https://api.siputzx.my.id${path.startsWith('/') ? path : '/' + path}`);
    
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    // Check if the response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      // Log usage
      await insertLog({
        userId: decoded.userId,
        username: decoded.username,
        action: "SIPUTZX_API",
        detail: `Used API: ${path}`,
        ip: req.ip || "unknown",
      });

      res.json({ success: true, data });
    } else {
      // If it's returning an image or file directly, we should handle it or just return the URL
      res.json({ success: true, is_file: true, url: url.toString() });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch from siputzx API" });
  }
});

export default router;