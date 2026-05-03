const KEYWORDS = [
  {word:"airdrop",w:22},{word:"memecoin",w:20},{word:"alpha",w:16},
  {word:"breaking",w:16},{word:"snapshot",w:15},{word:"mint",w:12},
  {word:"zora",w:11},{word:"nft",w:10},{word:"ai agent",w:14},
  {word:"🚀",w:8},{word:"🔥",w:7},{word:"massive",w:8},
];
function localScore(post){
  let score=0; const reasons=[];
  const eng = Math.min(post.recasts*5,35)+Math.min(post.likes*2,20)+Math.min(post.replies*3,15);
  score+=eng;
  if(eng>30) reasons.push("high engagement");
  score+=Math.min(Math.log10(post.followers+1)*5,20);
  if(post.followers>50000) reasons.push("influencer");
  const text=(post.text||"").toLowerCase();
  let kw=0; const matched=[];
  for(const k of KEYWORDS){ if(text.includes(k.word)){kw+=k.w;matched.push(k.word);} }
  score+=Math.min(kw,35);
  if(matched.length) reasons.push("trending: "+matched.slice(0,2).join(", "));
  const fresh = post.minutesAgo<10?10:post.minutesAgo<30?6:post.minutesAgo<60?3:0;
  score+=fresh;
  if(fresh>5) reasons.push("very recent");
  const final=Math.min(Math.round(score),100);
  return {
    score:final, viral:final>=65,
    reason:reasons.length?reasons.join(" · "):"low signal, normal post",
    engine:"local"
  };
}
async function scoreFeed(posts){
  return posts.map(p=>({...p,...localScore(p)}));
}
module.exports = { scoreFeed };
