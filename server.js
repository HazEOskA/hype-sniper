const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

app.get('/feed', async (req, res) => {
  try {
    if (!process.env.NEYNAR_API_KEY) {
      return res.status(500).json({ error: 'NEYNAR_API_KEY not set' });
    }
    const response = await axios.get('https://api.neynar.com/v2/farcaster/feed', {
      headers: { 'x-api-key': process.env.NEYNAR_API_KEY },
      params: { feed_type: 'filter', filter_type: 'global_trending', limit: 25 },
      timeout: 10000
    });
    res.json(response.data.casts || []);
  } catch (err) {
    console.error('[feed error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/refresh', async (req, res) => {
  res.json({ ok: true });
});

app.post('/mint', async (req, res) => {
  res.json({ ok: true, txHash: '0x0000' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HypeSniper backend running on 0.0.0.0:${PORT}`);
});
