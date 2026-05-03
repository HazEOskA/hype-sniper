require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { getFarcasterFeed } = require("./farcaster");
const { scoreFeed }        = require("./scorer");

const app  = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

let cache = { data: null, lastFetch: 0, source: "mock" };

async function getFeed(force = false) {
  const stale = Date.now() - cache.lastFetch > 60000;
  if (!force && !stale && cache.data) return cache;

  const { posts, source } = await getFarcasterFeed();
  const scored = await scoreFeed(posts);
  scored.sort((a, b) => {
    if (a.viral !== b.viral) return b.viral - a.viral;
    return b.score - a.score;
  });

  cache = { data: scored, lastFetch: Date.now(), source };
  console.log(`[feed] ${scored.filter(p=>p.viral).length} viral / ${scored.length} total · source: ${source}`);
  return cache;
}

// GET /feed
app.get("/feed", async (req, res) => {
  try {
    const { data, lastFetch, source } = await getFeed();
    res.json({
      ok: true, count: data.length,
      viralCount:  data.filter(p => p.viral).length,
      lastUpdated: new Date(lastFetch).toISOString(),
      source,
      engine: process.env.OPENROUTER_API_KEY ? "openrouter"
            : process.env.ANTHROPIC_API_KEY  ? "claude"
            : "local",
      posts: data,
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// POST /refresh
app.post("/refresh", async (req, res) => {
  try {
    const { data, lastFetch, source } = await getFeed(true);
    res.json({
      ok: true, message: "Refreshed",
      count: data.length,
      viralCount:  data.filter(p => p.viral).length,
      lastUpdated: new Date(lastFetch).toISOString(),
      source,
      engine: process.env.OPENROUTER_API_KEY ? "openrouter" : "local",
      posts: data,
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// POST /mint — Zora mint prep
app.post("/mint", async (req, res) => {
  try {
    const { postId, wallet } = req.body;
    if (!postId) return res.status(400).json({ ok: false, error: "postId required" });

    // Find post in cache
    const post = cache.data?.find(p => p.id === postId);
    if (!post) return res.status(404).json({ ok: false, error: "Post not found" });

    // Zora mint metadata
    const metadata = {
      name:        `HypeSniper: @${post.author}`,
      description: post.text.slice(0, 200),
      image:       `https://api.hypesniper.xyz/og/${postId}`,
      attributes: [
        { trait_type: "Viral Score",  value: post.score },
        { trait_type: "Author",       value: post.author },
        { trait_type: "Minted Via",   value: "HypeSniper" },
        { trait_type: "Engine",       value: post.engine || "local" },
      ],
    };

    // Zora contract details for Base L2
    const zoraConfig = {
      chain:        "base",
      chainId:      8453,
      contract:     "0x777777C338d93e2C7adf08D102d45CA7CC4Ed021", // Zora 1155 factory
      mintFee:      "0.000777",
      currency:     "ETH",
      metadata,
      // In production: use @zoralabs/creator-client to build tx
      // For now: return config for frontend to use with wagmi
      zoraUrl:      `https://zora.co/create/single-edition`,
    };

    console.log(`[mint] Prepared mint for post ${postId} · wallet: ${wallet || "not provided"}`);

    res.json({
      ok:         true,
      postId,
      author:     post.author,
      score:      post.score,
      zoraConfig,
      message:    "Mint config ready. Connect wallet to proceed.",
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// GET /health
app.get("/health", (req, res) => {
  res.json({
    ok:      true,
    uptime:  Math.floor(process.uptime()) + "s",
    engine:  process.env.OPENROUTER_API_KEY ? "openrouter" : "local",
    source:  process.env.NEYNAR_API_KEY     ? "neynar"     : "mock",
    cached:  !!cache.data,
  });
});

app.get("/", (req, res) => {
  res.json({ name: "Farcaster Hype Sniper", version: "2.0.0",
    endpoints: ["GET /feed","POST /refresh","POST /mint","GET /health"] });
});

app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║  Farcaster Hype Sniper v2.0          ║");
  console.log(`║  http://localhost:${PORT}               ║`);
  console.log("╚══════════════════════════════════════╝\n");
  console.log(`Engine : ${process.env.OPENROUTER_API_KEY ? "OpenRouter 🤖" : "Local ⚡"}`);
  console.log(`Source : ${process.env.NEYNAR_API_KEY     ? "Neynar (real) 🟣" : "Mock data 🎭"}\n`);
});
