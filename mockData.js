const AUTHORS = [
  { username: "vitalik",     followers: 890000, influence: 1.0 },
  { username: "jessepollak", followers: 142000, influence: 0.9 },
  { username: "punk6529",    followers: 210000, influence: 0.95 },
  { username: "horsefacts",  followers: 45000,  influence: 0.7 },
  { username: "cryptouser",  followers: 1200,   influence: 0.2 },
];
const VIRAL = [
  "Just deployed a new memecoin on Base $PEPE2 is live 🚀",
  "Breaking: Zora announced protocol rewards upgrade. Every mint earns ETH to creator. MASSIVE.",
  "New airdrop just dropped for early Farcaster users. Snapshot was yesterday.",
  "AI agent just autonomously minted 47 NFTs on Zora based on viral casts.",
  "JUST IN: $DEGEN airdrop season 3 confirmed. Stack your points NOW.",
  "Alpha: retroactive airdrop to all FC users who casted before March.",
  "I turned a viral cast into NFT in 3 clicks and it sold for 0.4 ETH 👇",
];
const NORMAL = [
  "Good morning from ETH Denver. The vibe here is immaculate.",
  "Has anyone tried the new Uniswap v4 hook system?",
  "Reading the Eigenlayer whitepaper. Dense but worth it.",
  "Pro tip: use cast threads for better reach on Farcaster.",
  "The Zora creator revenue model is underrated.",
  "Coffee + code + casts. Standard Sunday.",
];
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function generateFeed(count=20){
  return Array.from({length:count},(_,i)=>{
    const viral = Math.random()<0.35;
    const author = pick(AUTHORS);
    const text = pick(viral?VIRAL:NORMAL);
    const likes   = Math.floor((viral?rnd(200,8000):rnd(2,180))*(0.5+author.influence));
    const recasts = Math.floor((viral?rnd(80,3000): rnd(0,60)) *(0.5+author.influence));
    const replies = Math.floor((viral?rnd(30,1200): rnd(0,40)) *(0.5+author.influence));
    const minutesAgo = rnd(1,180);
    return {
      id:`cast_${Date.now()}_${i}`,
      text, author:author.username,
      followers:author.followers,
      likes, recasts, replies, minutesAgo,
      timestamp: new Date(Date.now()-minutesAgo*60000).toISOString()
    };
  });
}
module.exports = { generateFeed };
