function computeConfidence(signalCount, volatility, concentration) {
  let score = 50;

  if (signalCount > 3) score += 10;
  if (volatility < 0.3) score += 10;
  if (concentration < 40) score += 10;

  return Math.min(100, score);
}

module.exports = {
  computeConfidence,
};

