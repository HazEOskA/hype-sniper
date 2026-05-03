const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function getFarcasterFeed() {
  const key = process.env.NEYNAR_API_KEY;
  if (!key) {
    console.log('[farcaster] No NEYNAR key, using mock');
    const { getMockFeed } = require('./mockData');
    return { posts: getMockFeed(), source: 'mock' };
  }

  try {
    const res = await fetch(
      'https://api.neynar.com/v2/farcaster/feed/trending?limit=25&time_window=6h',
      {
        headers: {
          'accept': 'application/json',
          'api_key': key
        }
      }
    );

    if (!res.ok) throw new Error('Neynar HTTP ' + res.status);
    const data = await res.json();

    const posts = data.casts.map(cast => ({
      id:         cast.hash,
      author:     cast.author.username,
      text:       cast.text,
      likes:      cast.reactions.likes_count,
      recasts:    cast.reactions.recasts_count,
      replies:    cast.replies.count,
      followers:  cast.author.follower_count,
      minutesAgo: Math.floor((Date.now() - new Date(cast.timestamp).getTime()) / 60000),
      viral:      false,
      score:      0,
      reason:     ''
    }));

    console.log(`[farcaster] Fetched ${posts.length} posts from Neynar`);
    return { posts, source: 'neynar' };

  } catch (e) {
    console.error('[farcaster] Neynar error:', e.message);
    const { getMockFeed } = require('./mockData');
    return { posts: getMockFeed(), source: 'mock' };
  }
}

module.exports = { getFarcasterFeed };
