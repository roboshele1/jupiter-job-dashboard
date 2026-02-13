/**
 * Awareness Engine — D11
 * -----------------------
 * Heartbeat system state layer.
 *
 * Purpose:
 * - Produce a continuous, visualizable system awareness snapshot
 * - Never silent
 * - Read-only composition of:
 *    • decision interpreter
 *    • signals availability
 *    • normalized risk regime
 *
 * Rules:
 * - No execution
 * - No portfolio mutation
 * - No forecasting
 * - Observer-only
 */

import { interpretDecisionState } from "./decisionInterpreter.js";
import { assembleSignalsContext } from "./signalInterface.js";
import { normalizeRiskSnapshot } from "../risk/index.js";

const CONTRACT = "INTELLIGENCE_AWARENESS_ENGINE_V1";

function deriveAttentionLevel({ trajectoryPressure, signalsAvailable }) {
  if (trajectoryPressure === "ELEVATED" && signalsAvailable) return "HIGH";
  if (trajectoryPressure === "ELEVATED") return "ELEVATED";
  return "LOW";
}

function deriveSignalSurface(signalsAvailable) {
  if (!signalsAvailable) return "SILENT";
  return "WATCH";
}

function deriveSystemState({ trajectoryPressure, riskRegime }) {
  if (trajectoryPressure === "ELEVATED" && riskRegime === "STRESS")
    return "PRESSURED";

  if (trajectoryPressure === "ELEVATED")
    return "BUILDING";

  return "STABLE";
}

export async function buildAwarenessState() {
  const decision = await interpretDecisionState();
  const signals = await assembleSignalsContext();

  const normalizedRisk = normalizeRiskSnapshot({
    positions: signals?.riskSnapshot?.contributors?.ranked || [],
    totals: signals?.riskSnapshot?.totals || null
  });

  const trajectoryPressure = decision?.diagnostics?.trajectoryPressure || "UNKNOWN";
  const riskRegime = normalizedRisk?.regime || "UNKNOWN";
  const signalsAvailable = signals?.available ?? false;

  const awareness = {
    contract: CONTRACT,
    generatedAt: Date.now(),

    systemState: deriveSystemState({
      trajectoryPressure,
      riskRegime
    }),

    attentionLevel: deriveAttentionLevel({
      trajectoryPressure,
      signalsAvailable
    }),

    riskRegime,

    signalSurface: deriveSignalSurface(signalsAvailable),

    heartbeat: {
      timestamp: Date.now(),
      interpreter: true,
      signals: !!signals,
      risk: !!normalizedRisk
    },

    governance: {
      advisory: false,
      execution: false,
      simulation: false,
      reasoning: true
    }
  };

  return Object.freeze(awareness);
}

export default Object.freeze({
  buildAwarenessState
});
