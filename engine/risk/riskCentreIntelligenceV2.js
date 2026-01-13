// engine/risk/riskCentreIntelligenceV2.js

import { computeRiskCentreDeltas } from "./riskCentreDeltaEngine.js";
import { runRiskEngineV1 } from "./riskEngineV1.js";

/**
 * RISK CENTRE INTELLIGENCE — V2
 * --------------------------------
 * Deterministic, read-only intelligence anchor.
 * Consumes:
 * - Portfolio snapshot
 * - Growth trajectory V2
 * - Signals V2 snapshot
 */

export function buildRiskCentreIntelligenceV2({
  portfolioSnapshot,
  growthTrajectory,
  signalsSnapshot,
  previousState = null
}) {
  if (!portfolioSnapshot?.portfolio) {
    throw new Error("RISK_V2_INVALID_PORTFOLIO");
  }
  if (!growthTrajectory?.verdict) {
    throw new Error("CAPITAL_TRAJECTORY_V2_INVALID_INPUT");
  }
  if (!signalsSnapshot?.signals) {
    throw new Error("SIGNALS_V2_INVALID_INPUT");
  }

  const timestamp = Date.now();

  // -------------------------
  // PRESSURE DERIVATION
  // -------------------------
  const growthPressure =
    growthTrajectory.verdict.classification === "OUT_OF_BOUNDS"
      ? "ELEVATED"
      : "NORMAL";

  const materialSignals = signalsSnapshot.signals.filter(
    s => s.materiality === "HIGH" || s.materiality === "MODERATE"
  );

  const signalsPressure =
    materialSignals.length > 0 ? "ELEVATED" : "NORMAL";

  // -------------------------
  // POSTURE
  // -------------------------
  let posture = "STABLE";
  if (growthPressure === "ELEVATED" && signalsPressure === "ELEVATED") {
    posture = "TENSE";
  }

  // -------------------------
  // V1 METRICS (COMPAT)
  // -------------------------
  const v1Metrics = runRiskEngineV1({
    decisionOutput: {
      alerts: materialSignals.map(s => ({
        symbol: s.symbol,
        conviction: s.confidenceRank ?? 0
      }))
    },
    portfolio: portfolioSnapshot.portfolio,
    asOf: timestamp
  }).metrics;

  // -------------------------
  // DELTAS
  // -------------------------
  const deltas = computeRiskCentreDeltas({
    previous: previousState,
    current: {
      posture,
      scenarios: [],
      meta: { generatedAt: timestamp }
    }
  });

  return {
    contract: "RISK_CENTRE_INTELLIGENCE_V2",
    timestamp,
    posture,
    drivers: {
      growth: {
        classification: growthTrajectory.verdict.classification,
        pressure: growthPressure
      },
      signals: {
        surfacedCount: signalsSnapshot.signals.length,
        materialCount: materialSignals.length,
        pressure: signalsPressure
      }
    },
    v1Metrics,
    notes: [
      "Risk posture reflects plan fragility, not market prediction.",
      "Signals affect risk only when material.",
      "Growth infeasibility amplifies portfolio sensitivity."
    ],
    deltas
  };
}
