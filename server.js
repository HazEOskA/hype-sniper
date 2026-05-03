const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/feed', async (req, res) => {
  try {
    const response = await axios.get('https://api.neynar.com/v2/farcaster/feed', {
      headers: { 'x-api-key': process.env.NEYNAR_API_KEY },
      params: { feed_type: 'filter', filter_type: 'global_trending', limit: 25 }
    });
    res.json(response.data.casts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`HypeSniper backend · port ${PORT}`));
