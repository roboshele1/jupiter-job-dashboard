/**
 * varCalculator.js
 * Value at Risk (VaR) calculation at 95% confidence
 */

export function calculateVaR(holdings, portfolioValue) {
  console.log('[VaR] Input:', { holdingsCount: holdings?.length, portfolioValue });
  
  if (!holdings || !Array.isArray(holdings) || portfolioValue <= 0) {
    console.log('[VaR] Returning null - invalid input');
    return null;
  }

  const cryptoCount = holdings.filter(h => h.assetClass === 'crypto').length;
  const totalCount = holdings.length;
  const cryptoRatio = totalCount > 0 ? cryptoCount / totalCount : 0;

  console.log('[VaR] Composition:', { cryptoCount, totalCount, cryptoRatio });

  const equityVol = 0.015;
  const cryptoVol = 0.04;
  const blendedVolatility = (equityVol * (1 - cryptoRatio)) + (cryptoVol * cryptoRatio);

  const zScore = 1.645;
  const var1Day = portfolioValue * blendedVolatility * zScore;
  const var1DayPct = blendedVolatility * zScore * 100;
  const var10Day = var1Day * Math.sqrt(10);
  const var10DayPct = var1DayPct * Math.sqrt(10);

  const result = {
    var1Day: Math.round(var1Day),
    var1DayPct: Number(var1DayPct.toFixed(2)),
    var10Day: Math.round(var10Day),
    var10DayPct: Number(var10DayPct.toFixed(2)),
    confidence: 0.95,
    methodology: 'Parametric VaR with blended volatility'
  };

  console.log('[VaR] Result:', result);
  return result;
}
