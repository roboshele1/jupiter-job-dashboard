/**
 * DISCOVERY LAB — REGIME CLASSIFICATION ENGINE (D2.1)
 * --------------------------------------------------
 * Deterministically maps macro + market inputs
 * to exactly ONE economic regime.
 *
 * No forecasts. No discretion. No mutation.
 */

const { REGIMES } = require("./regimeDefinitions.js");

/**
 * Expected input (all numeric, pre-normalized upstream):
 * {
 *   realRates: number,        // e.g. 0.01
 *   liquidityTrend: number,   // +1 expanding, -1 contracting
 *   inflationTrend: number,   // +1 rising, -1 falling
 *   equityBreadth: number,    // % of stocks above 200DMA (0–1)
 *   volatilityIndex: number   // normalized VIX (0–1)
 * }
 */

function classifyRegime(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: regime input must be an object");
  }

  const {
    realRates,
    liquidityTrend,
    inflationTrend,
    equityBreadth,
    volatilityIndex,
  } = input;

  // Deterministic scoring
  const scores = {
    RISK_ON_GROWTH: 0,
    TIGHT_MONETARY: 0,
    INFLATIONARY_EXPANSION: 0,
    RISK_OFF_DEFENSIVE: 0,
  };

  // Real rates
  if (realRates <= 0.01) {
    scores.RISK_ON_GROWTH += 1;
    scores.INFLATIONARY_EXPANSION += 1;
  } else {
    scores.TIGHT_MONETARY += 1;
    scores.RISK_OFF_DEFENSIVE += 1;
  }

  // Liquidity
  if (liquidityTrend > 0) {
    scores.RISK_ON_GROWTH += 1;
  } else {
    scores.TIGHT_MONETARY += 1;
    scores.RISK_OFF_DEFENSIVE += 1;
  }

  // Inflation
  if (inflationTrend > 0) {
    scores.INFLATIONARY_EXPANSION += 1;
  } else {
    scores.RISK_ON_GROWTH += 1;
    scores.RISK_OFF_DEFENSIVE += 1;
  }

  // Equity breadth
  if (equityBreadth >= 0.6) {
    scores.RISK_ON_GROWTH += 1;
  } else if (equityBreadth <= 0.4) {
    scores.RISK_OFF_DEFENSIVE += 1;
  } else {
    scores.INFLATIONARY_EXPANSION += 1;
  }

  // Volatility
  if (volatilityIndex <= 0.4) {
    scores.RISK_ON_GROWTH += 1;
  } else if (volatilityIndex >= 0.7) {
    scores.RISK_OFF_DEFENSIVE += 1;
  } else {
    scores.TIGHT_MONETARY += 1;
  }

  // Select highest score (deterministic tie-breaker by order)
  const ordered = [
    "RISK_ON_GROWTH",
    "INFLATIONARY_EXPANSION",
    "TIGHT_MONETARY",
    "RISK_OFF_DEFENSIVE",
  ];

  let selected = ordered[0];
  for (const key of ordered) {
    if (scores[key] > scores[selected]) {
      selected = key;
    }
  }

  return Object.freeze({
    regime: selected,
    label: REGIMES[selected].label,
    scorecard: Object.freeze({ ...scores }),
    note:
      "Regime classification is deterministic and based solely on measurable inputs.",
  });
}

module.exports = Object.freeze({
  classifyRegime,
});
