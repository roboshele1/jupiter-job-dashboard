/**
 * Capital Structure Risk Engine
 * Regime-aware structural risk weighting
 */

module.exports = function capitalStructureRiskEngine(asset = {}) {
  const regime = asset.regime || 'PRIMARY';
  const structure = asset.structure || {};
  const reasons = [];
  let scorePenalty = 0;

  const dilutionRisk = !!structure.dilutionRisk;
  const binaryEventRisk = !!structure.binaryEventRisk;
  const reverseSplits = structure.reverseSplits || 0;
  const recentOfferings = structure.recentOfferings || 0;

  /* =========================
     REGIME: PRIMARY
  ========================= */
  if (regime === 'PRIMARY') {
    if (dilutionRisk) {
      reasons.push('Dilution risk (PRIMARY regime)');
      scorePenalty += 25;
    }

    if (binaryEventRisk) {
      reasons.push('Binary event dependency');
      scorePenalty += 20;
    }

    if (reverseSplits > 0) {
      reasons.push('Reverse split history');
      scorePenalty += 30;
    }

    return {
      penalty: scorePenalty,
      reasons,
      fatal: scorePenalty >= 25
    };
  }

  /* =========================
     REGIME: DEEP ASYMMETRY
  ========================= */
  if (regime === 'DEEP_ASYMMETRY') {
    if (dilutionRisk) {
      reasons.push('Managed dilution risk');
      scorePenalty += 10;
    }

    if (binaryEventRisk) {
      reasons.push('Binary catalyst dependency');
      scorePenalty += 10;
    }

    if (recentOfferings >= 2) {
      reasons.push('Repeated capital raises');
      scorePenalty += 15;
    }

    if (reverseSplits > 1) {
      reasons.push('Multiple reverse splits');
      scorePenalty += 25;
    }

    return {
      penalty: scorePenalty,
      reasons,
      fatal: scorePenalty >= 30
    };
  }

  return {
    penalty: 0,
    reasons: ['Unknown regime'],
    fatal: true
  };
};
