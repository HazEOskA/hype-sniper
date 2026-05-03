import axios from "axios";

export async function getFarcasterFeed() {
  try {
    const fids = [2, 3, 5, 8, 12, 20, 50, 100];
    const results = await Promise.all(
      fids.map(fid =>
        axios.get(`https://hub.pinata.cloud/v1/castsByFid?fid=${fid}&limit=8`)
          .then(r => r.data.messages || [])
          .catch(() => [])
      )
    );

    const posts = results.flat()
      .filter(m => m.data?.castAddBody?.text)
      .map(m => ({
        id: m.hash,
        text: m.data.castAddBody.text,
        author: "fid:" + m.data.fid,
        followers: 0,
        likes: 0,
        recasts: 0,
        replies: 0,
        timestamp: m.data.timestamp
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    return { posts, source: "hub" };
  } catch (e) {
    console.error("[farcaster] Error:", e.message);
    return { posts: [], source: "error" };
  }
}
