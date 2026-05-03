const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const HUB = "https://hoyt.farcaster.xyz:2281";

app.use(cors());
app.use(express.json());

let cache = { posts: [], lastUpdated: null };

const POPULAR_FIDS = [2, 3, 5, 8, 12, 20, 50, 100, 239, 1317, 1689, 3621, 5650, 7143];

function scorePost(p) {
  const likes   = p.likes   || 0;
  const recasts = p.recasts || 0;
  const replies = p.replies || 0;
  const text = (p.text || "").toLowerCase();
  const buzz = ["airdrop","nft","mint","defi","pump","alpha","launch","drop","free","earn","claim","zora","base","onchain","viral"].filter(w => text.includes(w)).length;
  let score = Math.round(Math.min(likes / 5, 15) + Math.min(recasts * 2, 15) + Math.min(buzz * 4, 16));
  score = Math.min(100, Math.max(0, score));
  const flags = [];
  if (likes > 50)   flags.push("High like count");
  if (recasts > 20) flags.push("Rapid recasting velocity");
  if (buzz >= 2)    flags.push("Trending keywords detected");
  return { score, viral: score >= 40, reason: flags.length ? "⚡ " + flags[0] : "📊 Steady engagement" };
}

async function fetchFromHub() {
  const results = await Promise.all(
    POPULAR_FIDS.map(fid =>
      fetch(`${HUB}/v1/castsByFid?fid=${fid}&limit=10`)
        .then(r => r.ok ? r.json() : { messages: [] })
        .then(d => d.messages || [])
        .catch(() => [])
    )
  );

  const seen = new Set();
  const posts = results.flat()
    .filter(m => m.data?.castAddBody?.text && !seen.has(m.hash) && seen.add(m.hash))
    .map(m => {
      const p = {
        id: m.hash,
        text: m.data.castAddBody.text,
        author: "fid:" + m.data.fid,
        likes: 0, recasts: 0, replies: 0,
        followers: 0,
        minutesAgo: 0,
      };
      const { score, viral, reason } = scorePost(p);
      return { ...p, score, viral, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  if (posts.length === 0) throw new Error("No posts from hub");
  cache = { posts, lastUpdated: new Date().toISOString() };
  return posts;
}

function respond(res, posts) {
  res.json({
    ok: true, count: posts.length,
    viralCount: posts.filter(p => p.viral).length,
    posts, engine: "local", source: "hub",
    lastUpdated: cache.lastUpdated || new Date().toISOString(),
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), source: "pinata-hub" });
});

app.get("/feed", async (_req, res) => {
  try {
    const age = cache.lastUpdated ? Date.now() - new Date(cache.lastUpdated).getTime() : Infinity;
    const posts = age < 5 * 60 * 1000 && cache.posts.length ? cache.posts : await fetchFromHub();
    respond(res, posts);
  } catch (err) {
    console.error("GET /feed:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/refresh", async (_req, res) => {
  try { respond(res, await fetchFromHub()); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post("/mint", (req, res) => {
  const { postId, wallet, signature } = req.body || {};
  res.json({ ok: true, postId, wallet, ts: Date.now() });
});

app.listen(PORT, () => {
  console.log(`HypeSniper backend · port ${PORT}`);
  fetchFromHub().catch(err => console.error("Warm-up failed:", err.message));
});
