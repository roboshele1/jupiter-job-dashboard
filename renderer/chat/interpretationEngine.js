import { derivePortfolioReasoning } from "../../engine/portfolioReasoning";

/**
 * Interpretation Engine
 * ---------------------
 * Consumes Dashboard truth and produces read-only interpretations.
 * No calculations. No advice. No mutations.
 */

export function interpretDashboard(snapshot) {
  const interpretation = {
    snapshot: {
      available: Boolean(snapshot),
      timestamp: snapshot?.timestamp ?? null,
    },
    portfolio: {
      totalValue: snapshot?.totalValue ?? null,
      dailyPL: snapshot?.dailyPL ?? null,
      dailyPLPct: snapshot?.dailyPLPct ?? null,
    },
    allocation: snapshot?.allocation ?? null,
    holdings: {
      top: snapshot?.topHoldings ?? [],
    },
    reasoning: null,
    system: {
      mode: "observer",
      phase: 3,
    },
  };

  // Portfolio Reasoning (read-only consumer)
  interpretation.reasoning = derivePortfolioReasoning(snapshot);

  return interpretation;
}

