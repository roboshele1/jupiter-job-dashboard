// engine/opportunity/opportunityDecisionEngine.js
// OPPORTUNITY DECISION ENGINE — Portfolio-Centric, Append-Only
// ------------------------------------------------------------
// - Consumes opportunityScanner output
// - Ranks + selects asymmetric opportunities
// - Produces deterministic decision candidates
// - No mutation of portfolio, alerts, or discovery layers

import { runOpportunityScan } from "./opportunityScanner.js";

/**
 * Convert raw opportunity scores into ranked decisions.
 */
function rankOpportunities(opportunities = []) {
  if (!Array.isArray(opportunities)) return [];

  return [...opportunities]
    .sort((a, b) => b.score - a.score)
    .map((o, idx) => ({
      symbol: o.symbol,
      score: o.score,
      rank: idx + 1,
      context: o.context || "unknown"
    }));
}

/**
 * Select top asymmetric candidates.
 * Deterministic thresholding — no randomness.
 */
function selectAsymmetricCandidates(ranked = []) {
  return ranked
    .filter(o => o.score >= 0.40)   // baseline asymmetry floor
    .slice(0, 5);                   // cap to top 5 signals
}

/**
 * Produce structured decision output.
 */
export function runOpportunityDecisionEngine() {
  const scan = runOpportunityScan();

  if (!scan || scan.status !== "OK") {
    return {
      timestamp: Date.now(),
      status: "NO_DECISIONS",
      reason: "NO_SCAN_DATA",
      decisions: []
    };
  }

  const ranked = rankOpportunities(scan.opportunities);
  const asymmetric = selectAsymmetricCandidates(ranked);

  return {
    timestamp: Date.now(),
    status: "OK",
    totalCandidates: ranked.length,
    asymmetricCount: asymmetric.length,
    decisions: asymmetric.map(d => ({
      symbol: d.symbol,
      convictionScore: d.score,
      rank: d.rank,
      context: d.context,
      decisionType: "WATCH_ACCUMULATE",
      source: "OPPORTUNITY_DECISION_ENGINE_V1"
    }))
  };
}
