/**
 * Survivability Gate
 * Institutional-grade hard rules
 * Regime-aware (PRIMARY vs DEEP_ASYMMETRY)
 */

const capitalStructureRiskEngine = require('./capitalStructureRiskEngine');

module.exports = function survivabilityGate(asset = {}) {
  const reasons = [];
  let score = 0;

  const regime = asset.regime || 'PRIMARY';

  const liquidity = asset.liquidity || {};
  const balanceSheet = asset.balanceSheet || {};
  const market = asset.market || {};

  const avgADV = liquidity.avgDailyDollarVolume || 0;
  const liquidityTrend = liquidity.trend || 'UNKNOWN';
  const runway = balanceSheet.cashRunwayMonths || 0;
  const venue = market.venue || 'UNKNOWN';

  /* =========================
     HARD LIQUIDITY FLOOR
  ========================= */
  if (avgADV < 5_000_000) {
    reasons.push('Insufficient liquidity (< $5M ADV)');
  }

  if (liquidityTrend === 'DECLINING') {
    reasons.push('Declining liquidity trend');
  }

  /* =========================
     CASH SURVIVABILITY
  ========================= */
  if (runway < 12) {
    reasons.push('Cash runway < 12 months');
  }

  /* =========================
     MARKET VENUE (REGIME-AWARE)
  ========================= */
  if (regime === 'PRIMARY') {
    if (venue !== 'NASDAQ' && venue !== 'NYSE') {
      reasons.push('Non-primary exchange (PRIMARY regime)');
    }
  }

  if (regime === 'DEEP_ASYMMETRY') {
    if (venue === 'OTC') {
      reasons.push('OTC venue (Deep Asymmetry penalty)');
    }
  }

  /* =========================
     CAPITAL STRUCTURE RISK
  ========================= */
  const structureRisk = capitalStructureRiskEngine(asset);

  if (structureRisk.fatal) {
    structureRisk.reasons.forEach(r => reasons.push(r));
  }

  /* =========================
     FINAL PASS / FAIL
  ========================= */
  if (reasons.length > 0 && structureRisk.fatal) {
    return {
      passed: false,
      score: 0,
      reasons
    };
  }

  /* =========================
     SCORING (ONLY IF PASSED)
  ========================= */
  score = 25;

  if (avgADV >= 10_000_000) score += 5;
  if (runway >= 18) score += 5;
  if (liquidityTrend === 'STABLE') score += 5;
  if (venue === 'NASDAQ' || venue === 'NYSE') score += 5;

  // Apply structure penalty (regime-aware)
  score = Math.max(0, score - (structureRisk.penalty || 0));

  return {
    passed: score >= 15,
    score,
    reasons
  };
};
