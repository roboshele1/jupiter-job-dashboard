/**
 * Growth Profile Extractor
 * Analyzes your holdings to extract "winner DNA"
 * Returns: revenueCAGR, marginTrend, growthScore, etc.
 */

export function extractGrowthProfile(historicalData) {
  if (!historicalData || historicalData.length < 4) return null;

  // Sort by date ascending
  const data = [...historicalData].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate revenue CAGR over available periods
  const oldest = data[0];
  const newest = data[data.length - 1];
  
  if (!oldest.revenue || !newest.revenue) return null;
  
  const years = (new Date(newest.date) - new Date(oldest.date)) / (365.25 * 24 * 60 * 60 * 1000);
  const cagr = Math.pow(newest.revenue / oldest.revenue, 1 / Math.max(years, 1)) - 1;
  
  // Calculate margin trend (are margins expanding?)
  const oldMargin = oldest.grossMargin || 0;
  const newMargin = newest.grossMargin || 0;
  const marginExpansion = newMargin - oldMargin;
  
  // Growth consistency (lower volatility = better)
  const growthRates = [];
  for (let i = 1; i < data.length; i++) {
    const gr = (data[i].revenue - data[i-1].revenue) / data[i-1].revenue;
    growthRates.push(gr);
  }
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const growthVolatility = Math.sqrt(growthRates.reduce((sum, g) => sum + Math.pow(g - avgGrowth, 2), 0) / growthRates.length);
  
  // Trajectory score (0-100)
  let score = 0;
  if (cagr > 0.5) score += 40;        // 50%+ CAGR = strong growth
  else if (cagr > 0.3) score += 25;   // 30%+ = good
  else if (cagr > 0.15) score += 10;  // 15%+ = moderate
  
  if (marginExpansion > 0.1) score += 30;  // Margins expanding = pricing power
  else if (marginExpansion > 0.05) score += 15;
  
  if (growthVolatility < 0.15) score += 20;  // Consistent growth = predictable
  else if (growthVolatility < 0.3) score += 10;
  
  return {
    revenueCAGR: cagr,
    marginExpansion,
    growthConsistency: 1 - growthVolatility,
    trajectoryScore: Math.min(100, score),
    profile: {
      isHighGrowth: cagr > 0.4,
      hasMarginPower: marginExpansion > 0.05,
      isConsistent: growthVolatility < 0.2,
    }
  };
}

/**
 * Score a candidate stock against a profile
 * Returns match score 0-100
 */
export function scoreAgainstProfile(candidateData, profileTemplate) {
  if (!candidateData || !profileTemplate) return 0;
  
  let score = 0;
  
  // Revenue CAGR match
  const cagrDiff = Math.abs(candidateData.revenueCAGR - profileTemplate.revenueCAGR);
  score += Math.max(0, 40 - (cagrDiff * 50));
  
  // Margin expansion match
  const marginDiff = Math.abs(candidateData.marginExpansion - profileTemplate.marginExpansion);
  score += Math.max(0, 30 - (marginDiff * 100));
  
  // Growth consistency match
  const consistencyDiff = Math.abs(candidateData.growthConsistency - profileTemplate.growthConsistency);
  score += Math.max(0, 30 - (consistencyDiff * 50));
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate 2x/3x probability
 */
export function calculate2x3xProbability(currentPrice, targetPrice, timelineMonths, volatility) {
  const requiredReturn = (targetPrice / currentPrice) - 1;
  
  // Black-Scholes inspired
  // Higher volatility + longer timeline = higher probability of hitting 3x
  const timelineYears = timelineMonths / 12;
  const riskAdjustment = Math.sqrt(timelineYears) * volatility;
  
  // Simplified: if required return is within 2 std devs, it's achievable
  const probability = Math.min(0.95, Math.max(0.05, 0.5 + (requiredReturn / (riskAdjustment * 2))));
  
  return {
    targetPrice,
    requiredReturn: (requiredReturn * 100).toFixed(1) + '%',
    probability: (probability * 100).toFixed(0) + '%',
    confidence: probability > 0.5 ? 'High' : probability > 0.3 ? 'Medium' : 'Low'
  };
}
