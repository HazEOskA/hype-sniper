const axios = require("axios");

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

// simple in-memory cache (żeby nie zabić API limitów)
let cache = {
  data: null,
  lastFetch: 0
};

async function getFarcasterFeed() {
  const now = Date.now();

  // cache 60s
  if (cache.data && now - cache.lastFetch < 60_000) {
    return {
      posts: cache.data,
      source: "neynar-cache"
    };
  }

  try {
    const res = await axios.get(
      "https://api.neynar.com/v2/farcaster/feed",
      {
        headers: {
          api_key: NEYNAR_API_KEY
        },
        params: {
          limit: 50
        }
      }
    );

    // normalizacja danych (safe mapping)
    const posts = (res.data.casts || []).map(p => ({
      hash: p.hash,
      text: p.text || "",
      author: {
        username: p.author?.username || "unknown",
        follower_count: p.author?.follower_count || 0
      },
      reactions: {
        likes_count: p.reactions?.likes_count || 0,
        recasts_count: p.reactions?.recasts_count || 0
      },
      replies: {
        count: p.replies?.count || 0
      },
      timestamp: p.timestamp || Date.now()
    }));

    cache = {
      data: posts,
      lastFetch: now
    };

    return {
      posts,
      source: "neynar"
    };

  } catch (err) {
    console.error("[FARCASTER ERROR]", err.message);

    // fallback → żeby appka nie padła
    return {
      posts: [],
      source: "error-fallback"
    };
  }
}

module.exports = { getFarcasterFeed };
