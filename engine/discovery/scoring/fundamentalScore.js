// engine/discovery/scoring/fundamentalScore.js

/**
 * FUNDAMENTAL SCORE — D1.2 (HARDENED)
 * ----------------------------------
 * Deterministic 0–10 score derived from normalized metrics.
 * Safe under partial or missing data.
 * No mutation. No timing. No regime awareness.
 */

function clamp(value, min = 0, max = 1) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

function safe(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function scoreFundamentals(normalized = {}) {
  if (typeof normalized !== "object") {
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
    (safe(normalized.revenueGrowth) + safe(normalized.epsGrowth)) / 2
  );

  const qualityScore = clamp(
    (safe(normalized.roe) + safe(normalized.roic, safe(normalized.roe))) / 2
  );

  const cashScore = clamp(safe(normalized.fcfMargin));

  const balanceScore = clamp(1 - safe(normalized.debtRatio));

  const penalty =
    safe(normalized.roe) < 0.3 || safe(normalized.fcfMargin) < 0.2 ? 0.3 : 0;

  const raw =
    growthScore * weights.growth +
    qualityScore * weights.quality +
    cashScore * weights.cash +
    balanceScore * weights.balance -
    penalty * weights.penalties;

  const finalScore = Math.round(clamp(raw) * 10 * 100) / 100;

  return Object.freeze({
    score: finalScore,
    factors: Object.freeze({
      growth: growthScore,
      quality: qualityScore,
      cash: cashScore,
      balance: balanceScore,
    }),
  });
}

module.exports = Object.freeze({
  scoreFundamentals,
});

