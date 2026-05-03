const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

app.use(cors());
app.use(express.json());

let cache = { posts: [], lastUpdated: null };

async function neynar(path, params = {}) {
  if (!NEYNAR_API_KEY) throw new Error("NEYNAR_API_KEY not set");
  const url = new URL(`${NEYNAR_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": NEYNAR_API_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Neynar ${res.status}: ${body}`);
  }
  return res.json();
}

function scorePost(cast) {
  const likes     = cast.reactions?.likes_count   ?? 0;
  const recasts   = cast.reactions?.recasts_count ?? 0;
  const replies   = cast.replies?.count           ?? 0;
  const followers = cast.author?.follower_count   ?? 1;

  const engagement = likes + recasts * 2 + replies * 1.5;
  const ratio      = Math.min(engagement / Math.max(followers, 1), 1);
  const velocity   = Math.min((likes + recasts) / 10, 20);

  const text = (cast.text || "").toLowerCase();
  const buzz = [
    "airdrop","nft","mint","defi","pump","alpha","launch","drop",
    "free","earn","claim","zora","base","onchain","viral","breaking",
  ].filter(w => text.includes(w)).length;

  let score = Math.round(
    ratio * 40 +
    velocity +
    Math.min(likes / 5, 15) +
    Math.min(recasts * 2, 15) +
    Math.min(buzz * 4, 16)
  );
  score = Math.min(100, Math.max(0, score));

  const flags = [];
  if (ratio > 0.3)   flags.push("Exceptional engagement ratio");
  if (recasts > 30)  flags.push("Rapid recasting velocity");
  if (likes > 100)   flags.push("High like count");
  if (buzz >= 2)     flags.push("Trending keywords detected");
  if (velocity > 15) flags.push("Explosive growth signal");

  return {
    score,
    reason: flags.length ? "⚡ " + flags[0] : "📊 Steady engagement",
    viral: score >= 65,
  };
}

function transform(cast) {
  const { score, reason, viral } = scorePost(cast);
  const minutesAgo = Math.max(
    0,
    Math.round((Date.now() - new Date(cast.timestamp).getTime()) / 60000)
  );
  return {
    id:        cast.hash,
    author:    cast.author?.username          ?? "unknown",
    text:      cast.text                      ?? "",
    score,
    viral,
    reason,
    likes:     cast.reactions?.likes_count    ?? 0,
    recasts:   cast.reactions?.recasts_count  ?? 0,
    replies:   cast.replies?.count            ?? 0,
    followers: cast.author?.follower_count    ?? 0,
    minutesAgo,
  };
}

async function fetchAndScore() {
  const data  = await neynar("/feed/trending", { limit: 40, time_window: "6h" });
  const posts = (data.casts || []).map(transform).sort((a, b) => b.score - a.score);
  cache = { posts, lastUpdated: new Date().toISOString() };
  return posts;
}

function respond(res, posts, source = "neynar") {
  res.json({
    ok:          true,
    count:       posts.length,
    viralCount:  posts.filter(p => p.viral).length,
    posts,
    engine:      "local",
    source,
    lastUpdated: cache.lastUpdated || new Date().toISOString(),
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), neynarKeySet: !!NEYNAR_API_KEY });
});

app.get("/feed", async (_req, res) => {
  try {
    const age = cache.lastUpdated
      ? Date.now() - new Date(cache.lastUpdated).getTime()
      : Infinity;
    const posts = age < 5 * 60 * 1000 && cache.posts.length
      ? cache.posts
      : await fetchAndScore();
    respond(res, posts);
  } catch (err) {
    console.error("GET /feed:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/refresh", async (_req, res) => {
  try {
    const posts = await fetchAndScore();
    respond(res, posts);
  } catch (err) {
    console.error("POST /refresh:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/mint", (req, res) => {
  const { postId, wallet, signature } = req.body || {};
  console.log("Mint:", { postId, wallet, sig: String(signature).slice(0, 20) });
  res.json({ ok: true, postId, wallet, ts: Date.now() });
});

app.listen(PORT, () => {
  console.log(`HypeSniper backend · port ${PORT}`);
  console.log(`NEYNAR_API_KEY: ${NEYNAR_API_KEY ? "✅ set" : "❌ MISSING"}`);
  fetchAndScore().catch(err => console.error("Warm-up failed:", err.message));
});
