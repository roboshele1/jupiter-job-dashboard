import { derivePortfolioReasoning } from "../../engine/portfolioReasoning";
import { synthesizeEngines } from "../../engine/crossEngineSynthesis";
import {
  enforceChatIntelligenceContract,
} from "../../engine/contracts/chatIntelligenceContract";

/**
 * Interpretation Engine
 * ---------------------
 * Phase 6 — Controlled Exposure
 *
 * - Consumes snapshot (read-only)
 * - Runs reasoning + cross-engine synthesis
 * - Enforces Chat intelligence contract before UI exposure
 *
 * NO UI
 * NO IPC
 * NO mutations
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
    chatExposure: null,

    system: {
      mode: "observer",
      phase: 6,
    },
  };

  // Phase 3 — Portfolio Reasoning (read-only)
  interpretation.reasoning = derivePortfolioReasoning(snapshot);

  // Phase 4 — Cross-engine synthesis (read-only)
  interpretation.synthesis = synthesizeEngines({
    riskProfile: snapshot?.riskProfile ?? null,
    riskDrivers: snapshot?.riskDrivers ?? null,
    breakOrder: snapshot?.breakOrder ?? null,
    growthFeasibility: snapshot?.growthFeasibility ?? null,
    portfolioReasoning: interpretation.reasoning,
  });

  // Phase 6 — Enforced Chat Exposure (contract-gated)
  interpretation.chatExposure = enforceChatIntelligenceContract(
    interpretation.synthesis
  );

  return interpretation;
}

