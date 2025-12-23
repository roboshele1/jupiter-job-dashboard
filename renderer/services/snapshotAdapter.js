// renderer/services/snapshotAdapter.js
// Read-only adapter layer
// Normalizes real holdings for snapshot consumers

import { fetchSnapshotHoldings } from "./snapshotSource";
import {
  getPortfolioSummary,
  getPortfolioAllocation
} from "./portfolioSnapshot";

export async function buildSnapshot() {
  const { holdings, meta } = await fetchSnapshotHoldings();

  return {
    meta,
    summary: getPortfolioSummary(holdings),
    allocation: getPortfolioAllocation(holdings),
    holdings
  };
}

