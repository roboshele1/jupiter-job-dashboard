/**
 * Insights Engine — Phase 1A (Observer Intelligence)
 *
 * Purpose:
 * - Synthesize a read-only Insights object from an Interpretation snapshot
 * - No advice, no actions, no mutation
 * - Deterministic and safe under missing data
 *
 * Contract:
 * - Input: interpretation (Phase 3 output)
 * - Output: insights (Phase 4 observer object)
 */

import { createEmptyInsights } from "./insightsSchema";
import {
  applySnapshotRules,
  applyPortfolioRules,
  applySignalRules,
  applyRiskRules,
} from "./insightsRules";

/**
 * Generate Insights from Interpretation
 * @param {object} interpretation
 * @returns {object} insights
 */
export function generateInsights(interpretation) {
  const insights = createEmptyInsights();

  // Defensive: interpretation must exist
  if (!interpretation || typeof interpretation !== "object") {
    insights.meta.status = "degraded";
    insights.limits.push("Interpretation unavailable");
    insights.warnings.push(
      "Insights generated in observer-safe degraded mode"
    );
    return insights;
  }

  // Snapshot presence
  if (!interpretation.snapshot?.available) {
    insights.meta.status = "partial";
    insights.limits.push("Snapshot not finalized");
    insights.warnings.push("Snapshot timestamp unavailable");
  } else {
    insights.meta.snapshotTimestamp = interpretation.snapshot.timestamp;
  }

  // Apply deterministic rule layers (NO SIDE EFFECTS)
  applySnapshotRules(interpretation, insights);
  applyPortfolioRules(interpretation, insights);
  applySignalRules(interpretation, insights);
  applyRiskRules(interpretation, insights);

  // Finalize observer metadata
  insights.meta.mode = "observer";
  insights.meta.phase = "1A";
  insights.meta.generatedAt = new Date().toISOString();

  return insights;
}

