const { generateFeed } = require("./mockData");

async function fetchRealFeed() {
  const key = process.env.NEYNAR_API_KEY;
  if (!key) throw new Error("No NEYNAR_API_KEY");

  const res = await fetch(
    "https://api.neynar.com/v2/farcaster/feed/trending?limit=25&time_window=6h",
    { headers: { "api_key": key, "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`Neynar ${res.status}`);
  const data = await res.json();

  return data.casts.map((c, i) => ({
    id:          c.hash,
    text:        c.text,
    author:      c.author.username,
    followers:   c.author.follower_count || 0,
    likes:       c.reactions?.likes_count  || 0,
    recasts:     c.reactions?.recasts_count || 0,
    replies:     c.replies?.count || 0,
    minutesAgo:  Math.floor((Date.now() - new Date(c.timestamp)) / 60000),
    timestamp:   c.timestamp,
    castUrl:     `https://warpcast.com/${c.author.username}/${c.hash.slice(0,10)}`,
  }));
}

async function getFarcasterFeed() {
  if (process.env.NEYNAR_API_KEY) {
    try {
      console.log("[farcaster] Fetching real data from Neynar...");
      const posts = await fetchRealFeed();
      console.log(`[farcaster] Got ${posts.length} real posts`);
      return { posts, source: "neynar" };
    } catch (e) {
      console.warn(`[farcaster] Neynar failed, using mock: ${e.message}`);
    }
  }
  console.log("[farcaster] Using mock data");
  return { posts: generateFeed(25), source: "mock" };
}

module.exports = { getFarcasterFeed };
