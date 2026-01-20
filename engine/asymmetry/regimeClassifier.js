/**
 * Regime Classifier
 * Determines PRIMARY vs DEEP_ASYMMETRY regime
 * Uses real, normalized market + structure data
 */

module.exports = function regimeClassifier(asset = {}) {
  const reasons = [];

  const venue = asset?.market?.venue || 'UNKNOWN';
  const adv = Number(asset?.liquidity?.avgDailyDollarVolume || 0);
  const floatShares = Number(asset?.structure?.floatShares || 0);
  const dilutionRisk = !!asset?.structure?.dilutionRisk;
  const recentOfferings = Number(asset?.structure?.recentOfferings || 0);

  // PRIMARY REGIME REQUIREMENTS
  const primaryVenue = venue === 'XNAS' || venue === 'XNYS';
  const primaryLiquidity = adv >= 10_000_000;
  const primaryFloat = floatShares === 0 || floatShares >= 25_000_000;
  const cleanStructure = !dilutionRisk && recentOfferings === 0;

  if (primaryVenue && primaryLiquidity && primaryFloat && cleanStructure) {
    return {
      regime: 'PRIMARY',
      confidence: 'HIGH',
      reasons: []
    };
  }

  // DEEP ASYMMETRY LOGIC
  if (!primaryVenue) reasons.push('Non-primary exchange');
  if (adv < 10_000_000) reasons.push('Sub-institutional liquidity');
  if (floatShares > 0 && floatShares < 25_000_000) reasons.push('Low float structure');
  if (dilutionRisk) reasons.push('Dilution risk present');
  if (recentOfferings > 0) reasons.push('Recent capital raise');

  return {
    regime: 'DEEP_ASYMMETRY',
    confidence: reasons.length >= 3 ? 'HIGH' : 'MEDIUM',
    reasons
  };
};
