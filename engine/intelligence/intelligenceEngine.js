/**
 * Intelligence Engine
 * -------------------
 * Central coordinator (read-only).
 *
 * Now wired to canonical latest snapshot authority.
 */

import { loadLatestSnapshot } from "../snapshots/latestSnapshotResolver.js";
import { requiredContribution } from "./planningEngine.js";
import { createEmptyIntelligenceInsight } from "./INTELLIGENCE_V2_CONTRACT.js";

export function runIntelligence() {

  const snapshot = loadLatestSnapshot();

  const portfolioValue =
    snapshot?.portfolioValue ||
    snapshot?.totals?.portfolioValue ||
    0;

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
    "Contribution feasibility computed using canonical latest portfolio snapshot.";

  insight.explanation.rationale =
    "Monthly contribution derived from planning engine using authoritative snapshot.";
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
    "latestSnapshotResolver"
  ];
  insight.evidence.snapshotTimestamp =
    snapshot?.timestamp || null;
  insight.evidence.dataFreshness =
    snapshot ? "SNAPSHOT" : "STALE";

  insight.confidence.level = snapshot ? "HIGH" : "LOW";
  insight.confidence.score = snapshot ? 0.88 : 0.35;
  insight.confidence.uncertaintyDrivers = [
    "Return variability",
    "Contribution consistency",
    "Snapshot frequency"
  ];

  insight.governance.adviceAllowed = false;
  insight.governance.executionAllowed = false;
  insight.governance.reasoningAllowed = true;

  insight.metadata.generatedAt = Date.now();
  insight.metadata.engineVersion = "INTELLIGENCE_OBSERVER_V3";
  insight.metadata.authority = "LATEST_SNAPSHOT_PIPELINE";

  return {
    snapshotLoaded: !!snapshot,
    portfolioValue,
    requiredContribution: contribution,
    insight
  };
}
