export function scoreSignal(data) {
  let score = 0;

  score += data.likes * 1;
  score += data.recasts * 2;
  score += data.comments * 1.5;

  if (data.velocity > 1.5) score += 20;
  if (data.walletQuality === "high") score += 30;

  return score;
}
