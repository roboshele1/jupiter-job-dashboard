function scoreTrajectory(metrics) {
  let score = 0;

  if (metrics.revenueGrowth > 25) score += 30;
  if (metrics.marginExpansion) score += 20;
  if (metrics.marketShareGain) score += 20;
  if (metrics.capexEfficiency) score += 10;
  if (metrics.freeCashFlowPositive) score += 20;

  return Math.min(100, score);
}

module.exports = {
  scoreTrajectory,
};

