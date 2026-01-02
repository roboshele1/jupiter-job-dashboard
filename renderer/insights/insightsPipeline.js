/**
 * Insights Pipeline — Phase 1B
 * Read-only snapshot observer
 */

import { generateInsights } from "./insightsEngine";
import { getPortfolioSnapshot } from "../state/portfolioSnapshotStore";

/**
 * Build observer-safe interpretation snapshot
 * @returns {object}
 */
export function buildInsightsSnapshot() {
  let snapshot = null;

  try {
    snapshot = getPortfolioSnapshot();
  } catch (e) {
    snapshot = null;
  }

  const interpretation = {
    snapshot: {
      available: Boolean(snapshot),
      timestamp: snapshot?.timestamp ?? null,
      portfolioValue: snapshot?.portfolioValue ?? null,
      dailyPL: snapshot?.dailyPL ?? null,
      dailyPLPct: snapshot?.dailyPLPct ?? null,
      allocation: snapshot?.allocation ?? null,
      topHoldings: snapshot?.topHoldings ?? null,
    },
    signals: {
      available: false,
    },
    risks: {
      available: false,
    },
  };

  return generateInsights(interpretation);
}

