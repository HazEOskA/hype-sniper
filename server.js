import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

app.use(cors());
app.use(express.json());

function neynarHeaders() {
  return {
    accept: "application/json",
    "content-type": "application/json",
    "x-api-key": NEYNAR_API_KEY,
  };
}

async function neynarGet(path, params = {}) {
  const url = new URL(`${NEYNAR_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: neynarHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw { status: res.status, message: err };
  }
  return res.json();
}

async function neynarPost(path, body = {}) {
  const res = await fetch(`${NEYNAR_BASE}${path}`, {
    method: "POST",
    headers: neynarHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw { status: res.status, message: err };
  }
  return res.json();
}

function handleError(res, err) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
}

app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Feed
app.get("/feed", async (req, res) => {
  try {
    const { feed_type = "following", fid, cursor, limit = 25 } = req.query;
    const data = await neynarGet("/feed", { feed_type, fid, cursor, limit });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Trending feed
app.get("/feed/trending", async (req, res) => {
  try {
    const { limit = 25, cursor, channel_id, time_window, provider } = req.query;
    const data = await neynarGet("/feed/trending", {
      limit,
      cursor,
      channel_id,
      time_window,
      provider,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// User by FID
app.get("/user/:fid", async (req, res) => {
  try {
    const { fid } = req.params;
    const data = await neynarGet("/user/bulk", { fids: fid });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// User by username
app.get("/user/by-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const data = await neynarGet("/user/by_username", { username });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Cast by hash
app.get("/cast/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const data = await neynarGet("/cast", { identifier: hash, type: "hash" });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Casts by FID
app.get("/casts", async (req, res) => {
  try {
    const { fid, cursor, limit = 25 } = req.query;
    const data = await neynarGet("/feed", {
      feed_type: "filter",
      filter_type: "fids",
      fids: fid,
      cursor,
      limit,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Reactions on a cast
app.get("/cast/:hash/reactions", async (req, res) => {
  try {
    const { hash } = req.params;
    const { reaction_type = "likes", limit = 25, cursor } = req.query;
    const data = await neynarGet("/reactions/cast", {
      hash,
      types: reaction_type,
      limit,
      cursor,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Search users
app.get("/search/users", async (req, res) => {
  try {
    const { q, limit = 10, cursor } = req.query;
    const data = await neynarGet("/user/search", { q, limit, cursor });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Search casts
app.get("/search/casts", async (req, res) => {
  try {
    const { q, limit = 25, cursor, priority_mode } = req.query;
    const data = await neynarGet("/cast/search", {
      q,
      limit,
      cursor,
      priority_mode,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Channel info
app.get("/channel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await neynarGet("/channel", { id });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Channel feed
app.get("/channel/:id/feed", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 25, cursor } = req.query;
    const data = await neynarGet("/feed/channel", {
      channel_ids: id,
      limit,
      cursor,
    });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Followers of a user
app.get("/user/:fid/followers", async (req, res) => {
  try {
    const { fid } = req.params;
    const { limit = 25, cursor } = req.query;
    const data = await neynarGet("/followers", { fid, limit, cursor });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// Following of a user
app.get("/user/:fid/following", async (req, res) => {
  try {
    const { fid } = req.params;
    const { limit = 25, cursor } = req.query;
    const data = await neynarGet("/following", { fid, limit, cursor });
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
