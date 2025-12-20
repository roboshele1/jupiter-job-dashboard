// renderer/services/riskSnapshotService.js
// Read-only snapshot layer for Risk UI

import {
  getPortfolioSummary,
  getPortfolioAllocation
} from "./portfolioSnapshot";

export function buildRiskSnapshot(holdings = []) {
  const summary = getPortfolioSummary(holdings);
  const allocation = getPortfolioAllocation(holdings);

  return {
    summary,
    allocation,
    ts: Date.now(),
  };
}

