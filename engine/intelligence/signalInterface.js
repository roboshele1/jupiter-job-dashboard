/**
 * Intelligence ↔ Signals Interface
 * --------------------------------
 * Read-only bridge.
 * Pulls portfolio + risk + growth context
 * then builds Signals V1 + V2 snapshots.
 *
 * D7 FIX:
 * raw snapshot → valuation enricher → signals
 */

import { loadLatestSnapshot } from "../snapshots/latestSnapshotResolver.js";
import { enrichSnapshotWithValuation } from "../snapshots/snapshotValuationEnricher.js";
import { buildSignalsSnapshot, buildSignalsV2Snapshot } from "../signals/index.js";
import { computeRiskSnapshot } from "../risk/riskEngine.js";
import { requiredContribution } from "./planningEngine.js";

export async function assembleSignalsContext() {
  const rawSnapshot = loadLatestSnapshot();

  if (!rawSnapshot) {
    return {
      available: false,
      reason: "NO_SNAPSHOT"
    };
  }

  // 🟢 NEW — canonical valuation bridge
  const enriched = await enrichSnapshotWithValuation(rawSnapshot);

  if (!enriched || !enriched.positions || !enriched.totals) {
    return {
      available: false,
      reason: "VALUATION_UNAVAILABLE"
    };
  }

  const portfolio = {
    positions: enriched.positions,
    totals: enriched.totals
  };

  const riskSnapshot = computeRiskSnapshot(portfolio);

  const growthTrajectory = {
    verdict: {
      classification:
        requiredContribution({
          targetAmount: 250000,
          currentAmount: portfolio.totals?.totalValue || 0,
          months: 36,
          expectedReturn: 0.08
        }) > 0
          ? "CONSTRAINED"
          : "FEASIBLE"
    }
  };

  const signalsV1 = buildSignalsSnapshot({
    portfolio,
    confidenceEvaluations: []
  });

  const signalsV2 = await buildSignalsV2Snapshot({
    portfolioSnapshot: enriched,
    growthTrajectory,
    riskSnapshot,
    confidenceEvaluations: []
  });

  return {
    available: true,
    signalsV1,
    signalsV2,
    riskSnapshot,
    growthTrajectory
  };
}
