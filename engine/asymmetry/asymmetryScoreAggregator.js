/**
 * Asymmetry Score Aggregator
 * Deterministic. Explainable. Survivability-gated.
 */

module.exports = function asymmetryScoreAggregator(signals = {}) {
  const {
    capitalFlow = { score: 0 },
    volatilityState = { score: 0 },
    survivability = { passed: false, score: 0, reasons: [] },
    structuralCatalyst = { score: 0 },
    narrativeDissonance = { score: 0 },
    optionalMomentumIgnition = { score: 0 }
  } = signals;

  // HARD FAIL — survivability gate
  if (!survivability.passed) {
    return {
      score: 0,
      disqualified: true,
      reasons: survivability.reasons || ['Failed survivability gate']
    };
  }

  const score =
    capitalFlow.score +
    volatilityState.score +
    survivability.score +
    structuralCatalyst.score +
    narrativeDissonance.score +
    optionalMomentumIgnition.score;

  return {
    score,
    disqualified: false,
    tier:
      score >= 85 ? 'ELITE' :
      score >= 75 ? 'SURFACED' :
      'REJECTED'
  };
};
