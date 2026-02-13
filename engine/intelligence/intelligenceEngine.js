/**
 * Intelligence Engine
 * -------------------
 * Central coordinator (read-only).
 *
 * D4.1 — Real Portfolio Intelligence Wiring
 * Now consumes canonical assembled portfolio context.
 */

import { assembleIntelligenceContext } from "./contextAssembler.js";
import { requiredContribution } from "./planningEngine.js";
import { createEmptyIntelligenceInsight } from "./INTELLIGENCE_V2_CONTRACT.js";

export async function runIntelligence() {

  const context = await assembleIntelligenceContext();

  const portfolioValue = context?.portfolioValue || 0;

  const contribution = requiredContribution({
    targetAmount: 250000,
    currentAmount: portfolioValue,
    months: 36,
    expectedReturn: 0.08
  });

  const insight = createEmptyIntelligenceInsight();

  insight.domain = "PORTFOLIO";
  insight.insightType = "FEASIBILITY";
  insight.summary =
    "Contribution feasibility computed using real portfolio valuation context.";

  insight.explanation.rationale =
    "Monthly contribution derived from planning engine using live portfolio authority.";
  insight.explanation.drivers = [
    "portfolioValue",
    "targetAmount",
    "months",
    "expectedReturn"
  ];
  insight.explanation.assumptions = [
    "Return remains constant",
    "Contribution occurs monthly"
  ];
  insight.explanation.exclusions = [
    "Market timing",
    "Execution decisions",
    "Signal overlays"
  ];

  insight.evidence.sources = [
    "planningEngine",
    "contextAssembler",
    "portfolioValuation"
  ];
  insight.evidence.snapshotTimestamp = context?.fetchedAt || null;
  insight.evidence.dataFreshness =
    context?.contextAvailable ? "LIVE_CONTEXT" : "STALE";

  insight.confidence.level = context?.contextAvailable ? "HIGH" : "LOW";
  insight.confidence.score = context?.contextAvailable ? 0.9 : 0.35;
  insight.confidence.uncertaintyDrivers = [
    "Return variability",
    "Contribution consistency",
    "Portfolio volatility"
  ];

  insight.governance.adviceAllowed = false;
  insight.governance.executionAllowed = false;
  insight.governance.reasoningAllowed = true;

  insight.metadata.generatedAt = Date.now();
  insight.metadata.engineVersion = "INTELLIGENCE_REAL_PORTFOLIO_V1";
  insight.metadata.authority = "CONTEXT_ASSEMBLER_PIPELINE";

  return {
    contextLoaded: !!context?.contextAvailable,
    portfolioValue,
    requiredContribution: contribution,
    insight
  };
}
