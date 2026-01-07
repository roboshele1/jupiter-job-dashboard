/**
 * D7.8 — Regime-Sensitive Ranking Engine
 * -------------------------------------
 * Purpose:
 * Rank Discovery results deterministically with
 * regime-aware weighting — WITHOUT changing:
 * - scores
 * - decisions
 * - explanations
 *
 * Ranking ONLY.
 */

const REGIME_RANK_WEIGHTS = Object.freeze({
  RISK_ON_GROWTH: Object.freeze({
    growth: 1.25,
    quality: 1.0,
    risk: 0.85,
    momentum: 1.15,
  }),

  INFLATIONARY_EXPANSION: Object.freeze({
    growth: 1.0,
    quality: 1.15,
    risk: 1.0,
    momentum: 0.9,
  }),

  TIGHT_MONETARY: Object.freeze({
    growth: 0.75,
    quality: 1.3,
    risk: 1.4,
    momentum: 0.85,
  }),

  RISK_OFF_DEFENSIVE: Object.freeze({
    growth: 0.6,
    quality: 1.4,
    risk: 1.5,
    momentum: 0.8,
  }),
});

function computeRankScore(result) {
  const { factorAttribution, regime } = result;

  const weights =
    REGIME_RANK_WEIGHTS[regime.label] ||
    REGIME_RANK_WEIGHTS.TIGHT_MONETARY;

  const f = factorAttribution || {};

  const score =
    (f.growth || 0) * weights.growth +
    (f.quality || 0) * weights.quality -
    (f.risk || 0) * weights.risk +
    (f.momentum || 0) * weights.momentum;

  return Number(score.toFixed(6));
}

function rankDiscoveryResults(results) {
  if (!Array.isArray(results)) {
    throw new Error("INVALID_INPUT: ranking requires array");
  }

  const scored = results.map(r =>
    Object.freeze({
      ...r,
      __rankScore: computeRankScore(r),
    })
  );

  const sorted = scored
    .slice()
    .sort((a, b) => b.__rankScore - a.__rankScore);

  return sorted.map((r, i) =>
    Object.freeze({
      ...r,
      rank: i + 1,
    })
  );
}

module.exports = Object.freeze({
  rankDiscoveryResults,
});
