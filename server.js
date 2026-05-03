const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'ok', port: PORT });
});

app.get('/feed', async (req, res) => {
  try {
    const key = process.env.NEYNAR_API_KEY || 'NEYNAR_API_DOCS';

    const response = await axios.get('https://api.neynar.com/v2/farcaster/feed/trending', {
      headers: { 'x-api-key': key },
      params: { limit: 25 },
      timeout: 10000
    });

    const casts = Array.isArray(response.data?.casts) ? response.data.casts : [];

    const posts = casts.map((c, i) => {
      const likes = c?.reactions?.likes_count ?? 0;
      const recasts = c?.reactions?.recasts_count ?? 0;
      const replies = c?.replies?.count ?? 0;
      const followers = c?.author?.follower_count ?? 0;
      const score = Math.min(100, likes * 2 + recasts * 3 + replies * 2);

      return {
        id: c?.hash || `post-${i}`,
        text: c?.text || '',
        author: c?.author?.username || 'unknown',
        followers,
        likes,
        recasts,
        replies,
        score,
        reason: score >= 80 ? 'High momentum' : 'Trending',
        minutesAgo: Math.floor((Date.now() - new Date(c?.timestamp).getTime()) / 60000)
      };
    });

    return res.json({
      ok: true,
      posts,
      source: 'neynar',
      engine: 'local',
      lastUpdated: Date.now()
    });

  } catch (err) {
    console.error('[feed error]', err.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      error: err.response?.data?.message || err.message || 'Feed failed',
      posts: []
    });
  }
});

app.post('/refresh', async (req, res) => {
  return res.json({ ok: true, posts: [], source: 'neynar', engine: 'local', lastUpdated: Date.now() });
});

app.post('/mint', async (req, res) => {
  return res.json({ ok: true, txHash: '0x0000' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HypeSniper backend running on 0.0.0.0:${PORT}`);
});
