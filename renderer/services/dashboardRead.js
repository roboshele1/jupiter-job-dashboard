// renderer/services/dashboardRead.js
// Deterministic read-only dashboard snapshot reader

import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export function readDashboardSnapshot() {
  const state = usePortfolioSnapshotStore.getState();

  return {
    holdings: state.holdings ?? [],
    lastUpdated: state.lastUpdated ?? null,
  };
}

