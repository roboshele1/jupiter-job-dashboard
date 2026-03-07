/**
 * Expected Return Calculator
 * Given thesis assumptions, calculates 2x/3x probability and expected value
 */

export function calculateExpectedReturn(thesis) {
  const {
    currentPrice,
    targetPrice2x,
    targetPrice3x,
    bullCaseProb,      // Probability thesis plays out (0-1)
    bearCaseProb,      // Probability thesis breaks (0-1)
    bullDownside,      // Downside if bear case (-0.3 = -30%)
    timelineMonths,    // How many months to 2x/3x
  } = thesis;

  // Validate inputs
  if (!currentPrice || !bullCaseProb || !bearCaseProb) {
    return { error: 'Missing required thesis inputs' };
  }

  const netProb = bullCaseProb + bearCaseProb;
  if (Math.abs(netProb - 1) > 0.01) {
    return { error: `Bull + Bear probability must equal 1 (got ${netProb})` };
  }

  // 2x calculation
  const target2x = targetPrice2x || currentPrice * 2;
  const upside2x = (target2x - currentPrice) / currentPrice;
  const expectedValue2x = (bullCaseProb * upside2x) + (bearCaseProb * bullDownside);
  const prob2xHit = bullCaseProb * (upside2x > 1 ? 0.9 : 0.7); // Adjust for achievability

  // 3x calculation
  const target3x = targetPrice3x || currentPrice * 3;
  const upside3x = (target3x - currentPrice) / currentPrice;
  const expectedValue3x = (bullCaseProb * upside3x) + (bearCaseProb * bullDownside);
  const prob3xHit = bullCaseProb * (upside3x > 2 ? 0.6 : 0.4);

  // Risk-adjusted return
  const sharpeAdjustment = 1 / (1 + Math.abs(bullDownside)); // Better if downside is smaller
  const adjustedEV2x = expectedValue2x * sharpeAdjustment;
  const adjustedEV3x = expectedValue3x * sharpeAdjustment;

  return {
    thesis: {
      currentPrice,
      bullCaseProb: (bullCaseProb * 100).toFixed(0) + '%',
      bearCaseProb: (bearCaseProb * 100).toFixed(0) + '%',
      downside: (bullDownside * 100).toFixed(1) + '%',
    },
    targets: {
      price2x: target2x.toFixed(2),
      price3x: target3x.toFixed(2),
    },
    probabilities: {
      prob2x: (Math.min(prob2xHit, 0.95) * 100).toFixed(0) + '%',
      prob3x: (Math.min(prob3xHit, 0.95) * 100).toFixed(0) + '%',
    },
    expectedValues: {
      ev2x: (expectedValue2x * 100).toFixed(1) + '%',
      ev3x: (expectedValue3x * 100).toFixed(1) + '%',
      adjustedEV2x: (adjustedEV2x * 100).toFixed(1) + '%',
      adjustedEV3x: (adjustedEV3x * 100).toFixed(1) + '%',
    },
    recommendation: getRecommendation(adjustedEV2x, adjustedEV3x, prob2xHit, prob3xHit),
    timelineMonths,
  };
}

function getRecommendation(ev2x, ev3x, prob2x, prob3x) {
  if (ev3x > 0.5 && prob3x > 0.4) {
    return '🚀 HIGH CONVICTION: Strong expected value with reasonable 3x probability';
  }
  if (ev2x > 0.3 && prob2x > 0.5) {
    return '✓ SOLID BET: Good risk-reward for 2x, moderate 3x potential';
  }
  if (ev2x > 0 && prob2x > 0.3) {
    return '⚠️ SPECULATIVE: Positive EV but depends heavily on thesis';
  }
  return '❌ POOR ODDS: Low expected value or high downside risk';
}

export function calculatePortfolioExpectedReturn(holdings, theses = {}) {
  let totalValue = 0;
  let weightedEV2x = 0;
  let weightedEV3x = 0;
  const results = [];

  for (const holding of holdings) {
    const thesis = theses[holding.symbol] || generateDefaultThesis(holding);
    const result = calculateExpectedReturn(thesis);
    
    if (result.error) continue;

    const holdingValue = holding.qty * holding.price;
    totalValue += holdingValue;
    const weight = holdingValue;

    const ev2x = parseFloat(result.expectedValues.ev2x) / 100;
    const ev3x = parseFloat(result.expectedValues.ev3x) / 100;

    weightedEV2x += ev2x * weight;
    weightedEV3x += ev3x * weight;

    results.push({
      symbol: holding.symbol,
      value: holdingValue.toFixed(2),
      ...result,
    });
  }

  const portfolioEV2x = totalValue > 0 ? (weightedEV2x / totalValue) * 100 : 0;
  const portfolioEV3x = totalValue > 0 ? (weightedEV3x / totalValue) * 100 : 0;

  return {
    totalPortfolioValue: totalValue.toFixed(2),
    portfolioExpectedReturnTo2x: portfolioEV2x.toFixed(1) + '%',
    portfolioExpectedReturnTo3x: portfolioEV3x.toFixed(1) + '%',
    holdings: results,
  };
}

function generateDefaultThesis(holding) {
  // Fallback: assume 60% bull, 40% bear, -30% downside
  return {
    currentPrice: holding.price,
    targetPrice2x: holding.price * 2,
    targetPrice3x: holding.price * 3,
    bullCaseProb: 0.6,
    bearCaseProb: 0.4,
    bullDownside: -0.3,
    timelineMonths: 12,
  };
}
