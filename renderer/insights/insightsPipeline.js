/**
 * Insights Pipeline — Phase 1B
 * Read-only PortfolioSnapshot observer
 */

import { generateInsights } from "./insightsEngine";
import * as PortfolioSnapshotStore from "../state/portfolioSnapshotStore";

/**
 * Build observer-safe interpretation snapshot
 * Reads ONLY from authoritative Portfolio snapshot
 */
export function buildInsightsSnapshot() {
  let snapshot = null;

  try {
    // Handle both function or value-based exports safely
    if (typeof PortfolioSnapshotStore.getSnapshot === "function") {
      snapshot = PortfolioSnapshotStore.getSnapshot();
    } else if (PortfolioSnapshotStore.snapshot) {
      snapshot = PortfolioSnapshotStore.snapshot;
    }
  } catch {
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
    signals: { available: false },
    risks: { available: false },
  };

  return generateInsights(interpretation);
}

