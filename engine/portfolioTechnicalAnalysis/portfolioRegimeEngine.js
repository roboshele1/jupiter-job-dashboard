// Portfolio Regime Engine — V1 (EMOTIONLESS, DATA-GATED)
//
// Contract:
// - Consumes Technical Analysis + Market Data
// - Enforces sufficiency gate BEFORE decisions
// - Emits BUY / HOLD / TRIM / REVIEW only when valid

import { assessMarketDataSufficiency } from "./marketDataSufficiencyGate.js";

function decideRegime({ trend, momentum, location }) {
  if (
    trend === "UNKNOWN" ||
    momentum === "UNKNOWN" ||
    location === "UNKNOWN"
  ) {
    return {
      regime: "REVIEW",
      confidence: "LOW",
      rationale:
        "Technical structure is not fully established. Monitor for clarity."
    };
  }

  if (trend === "UPTREND") {
    if (momentum === "STRONG" && location === "MID_RANGE") {
      return {
        regime: "BUY",
        confidence: "HIGH",
        rationale:
          "Uptrend with strong momentum and room within range. Add on weakness."
      };
    }

    if (momentum === "STRONG" && location === "NEAR_HIGHS") {
      return {
        regime: "HOLD",
        confidence: "HIGH",
        rationale:
          "Uptrend intact but price extended. Avoid chasing."
      };
    }

    if (momentum === "WEAK" && location === "NEAR_HIGHS") {
      return {
        regime: "TRIM",
        confidence: "MEDIUM",
        rationale:
          "Uptrend slowing near highs. Reduce exposure if overweight."
      };
    }
  }

  if (trend === "DOWNTREND" && momentum === "WEAK") {
    return {
      regime: "REVIEW",
      confidence: "HIGH",
      rationale:
        "Downtrend with weakening momentum. Do not add; reassess thesis."
    };
  }

  return {
    regime: "HOLD",
    confidence: "LOW",
    rationale:
      "Mixed technical signals. Maintain position until resolution."
  };
}

export function buildPortfolioRegimeSignals(technical, marketData) {
  const out = {};

  for (const symbol of Object.keys(technical.symbols)) {
    const t = technical.symbols[symbol];

    const sufficiency = assessMarketDataSufficiency(symbol, marketData);

    if (!sufficiency.eligible) {
      out[symbol] = Object.freeze({
        symbol,
        regime: "REVIEW",
        confidence: "LOW",
        rationale:
          "Insufficient historical data to issue a reliable signal.",
        dataStatus: sufficiency
      });
      continue;
    }

    const decision = decideRegime(t);

    out[symbol] = Object.freeze({
      symbol,
      trend: t.trend,
      momentum: t.momentum,
      location: t.location,
      regime: decision.regime,
      confidence: decision.confidence,
      rationale: decision.rationale
    });
  }

  return Object.freeze({
    contract: "PORTFOLIO_REGIME_SIGNALS_V1",
    asOf: new Date().toISOString(),
    symbols: Object.freeze(out)
  });
}

export default Object.freeze({ buildPortfolioRegimeSignals });
