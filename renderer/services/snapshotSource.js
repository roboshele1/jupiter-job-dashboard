// renderer/services/snapshotSource.js
// Read-only snapshot data source
// Adapts to the existing portfolio engine output

import { computePortfolioTotals } from "./portfolioEngine";
import { holdings } from "../state/holdings";

export async function fetchSnapshotHoldings() {
  return {
    holdings: Array.isArray(holdings) ? holdings : [],
    meta: {
      source: "state/holdings",
      capturedAt: new Date().toISOString(),
      totals: computePortfolioTotals(holdings || [])
    }
  };
}

