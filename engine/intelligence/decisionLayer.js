/**
 * Decision Layer (D6)
 * -------------------
 * Observer-only framing layer.
 *
 * Consumes:
 * - Intelligence output
 * - Context snapshot
 *
 * Produces:
 * - Structured decision framing
 *
 * Rules:
 * - No execution
 * - No portfolio mutation
 * - No trade suggestions
 * - No forecasting
 * - Read-only composition
 */

import { runIntelligence } from "./intelligenceEngine.js";
import { assembleIntelligenceContext } from "./contextAssembler.js";

const CONTRACT = "INTELLIGENCE_DECISION_LAYER_V1";

export async function buildDecisionFrame() {
  const context = await assembleIntelligenceContext();
  const intelligence = await runIntelligence();

  const portfolioValue =
    intelligence?.portfolioValue ??
    context?.totals?.liveValue ??
    0;

  const requiredContribution =
    intelligence?.requiredContribution ?? null;

  const framing = {
    contract: CONTRACT,
    generatedAt: Date.now(),

    inputs: {
      portfolioValue,
      requiredContribution,
      contextAvailable: !!context,
      intelligenceAvailable: !!intelligence
    },

    stateAssessment: {
      trajectoryPressure:
        requiredContribution && requiredContribution > 0
          ? "ELEVATED"
          : "STABLE",

      capitalPosition:
        portfolioValue > 0 ? "ACTIVE" : "UNFUNDED"
    },

    framingNotes: [
      "Decision layer is observer-only.",
      "No execution pathways permitted.",
      "No market timing or signals used.",
      "Portfolio authority remains upstream."
    ],

    governance: {
      advisory: false,
      execution: false,
      simulation: true,
      reasoning: true
    }
  };

  return Object.freeze(framing);
}

export default Object.freeze({
  buildDecisionFrame
});
