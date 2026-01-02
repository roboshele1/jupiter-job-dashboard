/**
 * Insights Pipeline — Phase 1A
 *
 * Responsibility:
 * - Pull latest portfolio snapshot (read-only)
 * - Pass snapshot into Insights Engine
 * - Never mutate, never compute, never IPC
 */

import { getLatestPortfolioSnapshot } from "../state/portfolioSnapshotStore";
import { generateInsights } from "./insightsEngine";

/**
 * Build observer-safe Insights object
 *
 * @returns {object} insights
 */
export function buildInsights() {
  let snapshot = null;

  try {
    snapshot = getLatestPortfolioSnapshot();
  } catch (e) {
    snapshot = null;
  }

  const interpretation = snapshot
    ? {
        snapshot: {
          available: true,
          timestamp: snapshot.timestamp,
        },
        portfolio: snapshot.portfolio,
        signals: snapshot.signals,
        risks: snapshot.risks,
      }
    : null;

  return generateInsights(interpretation);
}

