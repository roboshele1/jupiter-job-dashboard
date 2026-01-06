// engine/discovery/scoring/fundamentalScore.js

/**
 * FUNDAMENTAL SCORE — D1.2
 * ------------------------
 * Deterministic 0–10 score derived from normalized metrics.
 * No mutation. No timing. No regime awareness (added later).
 */

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function scoreFundamentals(normalized) {
  if (!normalized || typeof normalized !== "object") {
    throw new Error("INVALID_INPUT: normalized metrics required");
  }

  const weights = Object.freeze({
    growth: 0.30,
    quality: 0.25,
    cash: 0.20,
    balance: 0.15,
    penalties: 0.10,
  });

  const growthScore = clamp(
    (normalized.revenueGrowth + (normalized.epsGrowth || 0)) / 2
  );

  const qualityScore = clamp(
    (normalized.roe + (normalized.roic || normalized.roe)) / 2
  );

  const cashScore = clamp(normalized.fcfMargin || 0);

  const balanceScore = clamp(1 - (normalized.debtRatio || 0));

  const penalty =
    normalized.roe < 0.3 || normalized.fcfMargin < 0.2 ? 0.3 : 0;

  const raw =
    growthScore * weights.growth +
    qualityScore * weights.quality +
    cashScore * weights.cash +
    balanceScore * weights.balance -
    penalty * weights.penalties;

  return Math.round(clamp(raw) * 10 * 100) / 100;
}

module.exports = Object.freeze({
  scoreFundamentals,
});
