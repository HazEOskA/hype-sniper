export function evaluateSignal(data) {
  let score = 0;

  // velocity (najważniejsze)
  if (data.velocity > 2) score += 40;
  else if (data.velocity > 1.2) score += 20;

  // engagement quality
  score += (data.likes || 0) * 1;
  score += (data.recasts || 0) * 2;
  score += (data.comments || 0) * 1.5;

  // anti-noise filter
  if (data.isSpam) score -= 50;
  if (data.botActivity) score -= 30;

  // whale signal (opcjonalnie)
  if (data.smartWalletInteraction) score += 30;

  return {
    score,
    action:
      score > 80 ? "EXECUTE" :
      score > 50 ? "WATCH" :
      "IGNORE"
  };
}
