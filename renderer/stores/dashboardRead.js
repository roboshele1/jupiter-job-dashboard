/**
 * dashboardRead
 * ----------------
 * Canonical read-only access to Dashboard truth.
 * This is the ONLY surface Chat is allowed to consume in Phase 2.
 */

import { buildSnapshot } from "../services/snapshotAdapter";

export async function readDashboardTruth() {
  const snapshot = await buildSnapshot();

  const { meta, summary, allocation, holdings } = snapshot;

  return {
    portfolioValue: summary?.totalValue ?? null,
    dailyPL: summary?.dailyPL ?? null,
    dailyPLPct: summary?.dailyPLPct ?? null,
    allocation: allocation ?? null,
    topHoldings: holdings
      ? holdings.slice(0, 5).map(h => ({
          symbol: h.symbol,
          quantity: h.quantity
        }))
      : null,
    snapshotTimestamp: meta?.timestamp ?? null
  };
}

