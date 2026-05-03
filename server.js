const express = require("express");
const app = express();

app.get("/feed", async (req, res) => {
  try {
    const key = process.env.NEYNAR_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "Missing NEYNAR_API_KEY in Railway"
      });
    }

    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/feed?limit=10",
      {
        headers: {
          "x-api-key": key,
        },
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;      hash: p.hash,
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
