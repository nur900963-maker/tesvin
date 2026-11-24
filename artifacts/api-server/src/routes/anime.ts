import { Router } from "express";
import https from "https";

const router = Router();

async function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function formatAnime(anime: any) {
  return {
    id: anime.mal_id,
    title: anime.title || anime.title_english || "Unknown",
    image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
    score: anime.score ?? null,
    year: anime.year ?? null,
    type: anime.type ?? null,
    synopsis: anime.synopsis ?? null,
    episodes: anime.episodes ?? null,
  };
}

router.get("/anime/search", async (req, res) => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: "Query required" });
    return;
  }

  try {
    const data = await fetchJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=20`);
    if (data?.data) {
      res.json(data.data.map(formatAnime));
      return;
    }
  } catch {}

  res.json([]);
});

router.get("/anime/trending", async (req, res) => {
  try {
    const data = await fetchJson("https://api.jikan.moe/v4/top/anime?limit=20&type=tv");
    if (data?.data) {
      res.json(data.data.map(formatAnime));
      return;
    }
  } catch {}

  res.json([]);
});

export default router;
