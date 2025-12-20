// renderer/services/portfolioSnapshot.js
// Read-only adapter layer for Risk / Snapshot UI

import { computePortfolioTotals } from "./portfolioEngine";

/**
 * Expected by RiskSnapshot / RiskMetricsPanel
 * Normalizes existing portfolio engine output
 */

export function getPortfolioSummary(holdings = []) {
  const totals = computePortfolioTotals(holdings);

  return {
    totalValue: totals.totalValue ?? 0,
    totalPL: totals.totalPL ?? 0,
    totalPLPct: totals.totalPLPct ?? 0,
  };
}

export function getPortfolioAllocation(holdings = []) {
  if (!holdings.length) {
    return {
      Equity: 0,
      Digital: 0,
    };
  }

  const totals = computePortfolioTotals(holdings);
  const totalValue = totals.totalValue || 1;

  const allocation = {};

  for (const h of holdings) {
    const type = h.type || "Unknown";
    allocation[type] = (allocation[type] || 0) + h.marketValue;
  }

  Object.keys(allocation).forEach((k) => {
    allocation[k] = Number(((allocation[k] / totalValue) * 100).toFixed(2));
  });

  return allocation;
}

