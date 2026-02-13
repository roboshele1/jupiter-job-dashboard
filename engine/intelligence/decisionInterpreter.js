/**
 * Decision Interpreter — D10
 * ---------------------------
 * Converts convergence state into human-readable system posture.
 *
 * Rules:
 * - Read-only
 * - No execution
 * - No advice
 * - No forecasts
 * - No portfolio mutation
 */

import { buildDecisionFrame } from "./decisionLayer.js";
import { assembleSignalsContext } from "./signalInterface.js";
import { normalizeRiskSnapshot } from "../risk/index.js";

const CONTRACT = "INTELLIGENCE_DECISION_INTERPRETER_V1";

function classifyPosture({ trajectoryPressure, riskRegime }) {
  if (riskRegime === "STRESS") return "DEFENSIVE";
  if (riskRegime === "RISK_OFF") return "GUARDED";

  if (trajectoryPressure === "ELEVATED") return "PRESSURED";
  return "STABLE";
}

function classifyCapitalState(portfolioValue = 0, requiredContribution = null) {
  if (!portfolioValue) return "UNFUNDED";
  if (requiredContribution && requiredContribution > 0) return "BUILD_PHASE";
  return "COMPOUNDING";
}

function confidenceBand(signalsAvailable, riskRegime) {
  if (riskRegime === "STRESS") return "LOW";
  if (signalsAvailable) return "MEDIUM";
  return "HIGH";
}

export async function interpretDecisionState() {
  const frame = await buildDecisionFrame();
  const signals = await assembleSignalsContext();

  const risk = normalizeRiskSnapshot({
    positions: signals?.riskSnapshot?.contributors?.ranked || [],
    totals: signals?.riskSnapshot?.totals || null
  });

  const trajectoryPressure = frame?.stateAssessment?.trajectoryPressure;
  const portfolioValue = frame?.inputs?.portfolioValue;
  const requiredContribution = frame?.inputs?.requiredContribution;

  const posture = classifyPosture({
    trajectoryPressure,
    riskRegime: risk?.regime
  });

  const capitalState = classifyCapitalState(
    portfolioValue,
    requiredContribution
  );

  const confidence = confidenceBand(
    signals?.available,
    risk?.regime
  );

  const interpretation = {
    contract: CONTRACT,
    generatedAt: Date.now(),

    systemPosture: posture,
    capitalState,
    confidenceBand: confidence,

    diagnostics: {
      trajectoryPressure,
      riskRegime: risk?.regime,
      signalsAvailable: signals?.available ?? false
    },

    governance: {
      advisory: false,
      execution: false,
      forecasting: false,
      reasoning: true
    }
  };

  return Object.freeze(interpretation);
}

export default Object.freeze({
  interpretDecisionState
});
