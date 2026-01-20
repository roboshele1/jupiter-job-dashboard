/**
 * Position Pressure & Capital Allocation Lens
 * Regime-aware, non-execution, non-sizing
 */

module.exports = function positionPressureLens(asset = {}) {
  const regime = asset.regime || 'PRIMARY';

  const adv = asset.liquidity?.avgDailyDollarVolume || 0;
  const floatShares = asset.structure?.floatShares || null;
  const dilutionRisk = asset.structure?.dilutionRisk === true;
  const recentOfferings = asset.structure?.recentOfferings || 0;

  let pressureScore = 0;
  const notes = [];

  // --- Liquidity Pressure ---
  if (adv >= 20000000) {
    pressureScore += 30;
    notes.push('High liquidity — strong capital absorption');
  } else if (adv >= 5000000) {
    pressureScore += 20;
    notes.push('Moderate liquidity — controlled capital inflow');
  } else if (adv >= 1000000) {
    pressureScore += 10;
    notes.push('Thin liquidity — capital must stay disciplined');
  } else {
    pressureScore += 0;
    notes.push('Illiquid — position pressure risk');
  }

  // --- Float Stress ---
  if (floatShares) {
    if (floatShares < 20000000) {
      pressureScore += 15;
      notes.push('Low float — asymmetric upside but pressure sensitive');
    } else {
      pressureScore += 5;
      notes.push('Large float — pressure diffused');
    }
  }

  // --- Capital Structure Penalties ---
  if (dilutionRisk) {
    pressureScore -= regime === 'DEEP_ASYMMETRY' ? 5 : 15;
    notes.push('Dilution risk present');
  }

  if (recentOfferings > 0) {
    pressureScore -= 10;
    notes.push('Recent capital raise — pressure sensitivity elevated');
  }

  // --- Regime Adjustment ---
  if (regime === 'DEEP_ASYMMETRY') {
    notes.push('Deep Asymmetry regime — pressure tolerance intentionally higher');
  } else {
    notes.push('Primary regime — capital preservation prioritized');
  }

  // Clamp score
  pressureScore = Math.max(0, Math.min(100, pressureScore));

  let pressureBand = 'LOW';
  if (pressureScore >= 70) pressureBand = 'HIGH';
  else if (pressureScore >= 40) pressureBand = 'MEDIUM';

  return {
    regime,
    pressureScore,
    pressureBand,
    interpretation:
      pressureBand === 'HIGH'
        ? 'Can absorb meaningful capital without breaking asymmetry'
        : pressureBand === 'MEDIUM'
        ? 'Capital inflow must be staged and monitored'
        : 'Highly pressure sensitive — only early asymmetry capital',
    notes
  };
};
