/**
 * DISCOVERY LAB — ECONOMIC REGIME DEFINITIONS (D2.0)
 * -------------------------------------------------
 * Purpose:
 * Deterministically classify the prevailing economic regime
 * using measurable macro and market inputs only.
 *
 * This file defines regimes — it does NOT score assets.
 * No narratives, no forecasts, no discretion.
 */

const REGIMES = Object.freeze({
  RISK_ON_GROWTH: {
    label: "Risk-On Growth",
    description:
      "Growth-oriented environment where capital favors expansion, innovation, and higher-risk assets.",
    conditions: Object.freeze({
      realRates: "LOW_OR_FALLING",
      liquidity: "EXPANDING",
      inflationTrend: "STABLE_OR_FALLING",
      equityBreadth: "BROAD_POSITIVE",
      volatility: "CONTAINED",
    }),
  },

  TIGHT_MONETARY: {
    label: "Tight Monetary",
    description:
      "Restrictive policy environment where higher rates and tighter liquidity pressure valuations.",
    conditions: Object.freeze({
      realRates: "HIGH_OR_RISING",
      liquidity: "CONTRACTING",
      inflationTrend: "STUBBORN",
      equityBreadth: "NARROW",
      volatility: "ELEVATED",
    }),
  },

  INFLATIONARY_EXPANSION: {
    label: "Inflationary Expansion",
    description:
      "Economic growth with elevated inflation, favoring pricing power and real assets.",
    conditions: Object.freeze({
      realRates: "LOW_RELATIVE",
      liquidity: "NEUTRAL",
      inflationTrend: "RISING",
      equityBreadth: "MIXED",
      volatility: "MODERATE",
    }),
  },

  RISK_OFF_DEFENSIVE: {
    label: "Risk-Off Defensive",
    description:
      "Capital preservation environment where risk appetite is low and volatility is high.",
    conditions: Object.freeze({
      realRates: "HIGH",
      liquidity: "CONTRACTING",
      inflationTrend: "FALLING_OR_DEFLATIONARY",
      equityBreadth: "NEGATIVE",
      volatility: "HIGH",
    }),
  },
});

module.exports = Object.freeze({
  REGIMES,
});
