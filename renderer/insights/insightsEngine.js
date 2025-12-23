/**
 * insightsEngine
 * --------------
 * Phase 4 Insights Engine orchestrator.
 * Combines schema + deterministic rules
 * to produce a read-only Insights object.
 */

import { createEmptyInsights } from "./insightsSchema";
import {
  applySnapshotRules,
  applyPortfolioRules,
  applySignalRules,
  applyRiskRules
} from "./insightsRules";

/**
 * Generate Insights from Phase 3 interpretation.
 * @param {object} interpretation - Output of interpretation engine
 * @returns {object} insights
 */
export function generateInsights(interpretation) {
  const insights = createEmptyInsights();

  if (!interpretation || typeof interpretation !== "object") {
    insights.risks.dataLimitations.push(
      "Interpretation unavailable; insights cannot be generated."
    );
    return insights;
  }

  applySnapshotRules(interpretation, insights);
  applyPortfolioRules(interpretation, insights);
  applySignalRules(interpretation, insights);
  applyRiskRules(interpretation, insights);

  return insights;
}


