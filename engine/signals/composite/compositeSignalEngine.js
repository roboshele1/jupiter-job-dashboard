/**
 * D12.2 — Composite Signal Engine (Stage 1)
 * ----------------------------------------
 * Purpose:
 * - Aggregate regime + fundamental signals into a normalized structure
 * - Read-only, deterministic
 * - No confidence transitions
 * - No execution
 * - No UI coupling
 *
 * This engine prepares institutional-grade inputs for autonomy,
 * without making decisions.
 */

function runCompositeSignalEngine({
  symbol,
  regime,
  fundamentals = {},
  marketContext = {},
} = {}) {
  if (!symbol) {
    throw new Error("COMPOSITE_SIGNAL_INVALID: symbol required");
  }

  if (!regime) {
    throw new Error("COMPOSITE_SIGNAL_INVALID: regime required");
  }

  // --- Fundamental normalization (coarse, deterministic) ---
  const fundamentalScore = normalizeFundamentals(fundamentals);

  // --- Regime weighting (macro dominance) ---
  const regimeWeight = normalizeRegime(regime);

  // --- Market context (non-price, structural only) ---
  const marketPenalty = normalizeMarketContext(marketContext);

  // --- Composite score (bounded, explainable) ---
  const compositeScore = clamp(
    fundamentalScore * regimeWeight - marketPenalty,
    0,
    1
  );

  return Object.freeze({
    symbol,
    regime,
    inputs: Object.freeze({
      fundamentals,
      marketContext,
    }),
    signals: Object.freeze({
      fundamentalScore,
      regimeWeight,
      marketPenalty,
      compositeScore,
    }),
    interpretation: Object.freeze({
      summary:
        "Composite signal reflects structural alignment between fundamentals and macro regime.",
      disclaimer:
        "Composite signals are analytical only. They do not imply timing, prediction, or action.",
    }),
    metadata: Object.freeze({
      contract: "COMPOSITE_SIGNAL_V1",
      generatedAt: new Date().toISOString(),
    }),
  });
}

/* ============================================================
   Helpers
   ============================================================ */

function normalizeFundamentals(f = {}) {
  let score = 0;

  if (f.profitability === "strong") score += 0.4;
  if (f.balanceSheet === "strong") score += 0.3;
  if (f.growth === "strong") score += 0.3;

  return clamp(score, 0, 1);
}

function normalizeRegime(regime) {
  switch (regime) {
    case "RISK_ON_GROWTH":
      return 1.0;
    case "NEUTRAL":
      return 0.8;
    case "TIGHT_MONETARY":
      return 0.5;
    case "RISK_OFF":
      return 0.3;
    default:
      return 0.6;
  }
}

function normalizeMarketContext(ctx = {}) {
  let penalty = 0;

  if (ctx.volatility === "high") penalty += 0.2;
  if (ctx.liquidity === "tight") penalty += 0.2;

  return clamp(penalty, 0, 0.4);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

module.exports = Object.freeze({
  runCompositeSignalEngine,
});
