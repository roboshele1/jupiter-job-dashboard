import { derivePortfolioReasoning } from "../../engine/portfolioReasoning";
import { synthesizeEngines } from "../../engine/crossEngineSynthesis";

/**
 * Interpretation Engine
 * ---------------------
 * Consumes Dashboard truth and produces read-only interpretations.
 * No calculations. No advice. No mutations.
 *
 * Phase 3: Portfolio reasoning
 * Phase 4: Cross-engine synthesis (observer-only)
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
    synthesis: null,

    system: {
      mode: "observer",
      phase: 4,
    },
  };

  /* ===============================
     Phase 3 — Portfolio Reasoning
     =============================== */

  interpretation.reasoning = derivePortfolioReasoning(snapshot);

  /* ==================================
     Phase 4 — Cross-Engine Synthesis
     (read-only, descriptive only)
     ================================== */

  interpretation.synthesis = synthesizeEngines({
    riskProfile: snapshot?.riskProfile ?? null,
    riskDrivers: snapshot?.riskDrivers ?? null,
    breakOrder: snapshot?.breakOrder ?? null,
    growthFeasibility: snapshot?.growthFeasibility ?? null,
    portfolioReasoning: interpretation.reasoning,
  });

  return interpretation;
}

