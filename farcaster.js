const axios = require("axios");

async function getFarcasterFeed() {
  try {
    const res = await axios.get(
      "https://api.neynar.com/v2/farcaster/feed",
      
      headers: { "x-api-key": process.env.NEYNAR_API_KEY },
        params: { limit: 50 }
      }
    );
    const posts = (res.data.casts || []).map(p => ({
      id: p.hash,
      text: p.text || "",
      author: p.author?.username || "unknown",
      followers: p.author?.follower_count || 0,
      likes: p.reactions?.likes_count || 0,
      recasts: p.reactions?.recasts_count || 0,
      replies: p.replies?.count || 0,
      timestamp: p.timestamp || Date.now()
    }));
    return { posts, source: "neynar" };
  } catch (e) {
    console.error("[farcaster] Error:", e.message);
    return { posts: [], source: "error" };
  }
}

module.exports = { getFarcasterFeed };
