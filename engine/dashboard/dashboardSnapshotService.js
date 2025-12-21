// engine/dashboard/dashboardSnapshotService.js
// READ-ONLY aggregation layer
// Source of truth: portfolioSnapshotService (LOCKED)

import { calculatePortfolioSnapshot } from "../portfolio/portfolioSnapshotService.js";

export async function getDashboardSnapshot() {
  const portfolio = await calculatePortfolioSnapshot();

  const totalValue = portfolio.totals.value;
  const totalCost = portfolio.totals.cost;
  const totalPnL = portfolio.totals.pnl;
  const pnlPct = totalCost > 0 ? totalPnL / totalCost : 0;

  const topPositions = [...portfolio.positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 5);

  const allocation = {};
  for (const pos of portfolio.positions) {
    allocation[pos.symbol] = pos.marketValue;
  }

  return {
    timestamp: portfolio.timestamp,
    totals: {
      value: totalValue,
      cost: totalCost,
      pnl: totalPnL,
      pnlPct
    },
    topPositions,
    allocation,
    authority: "DASHBOARD_AGGREGATION_V1"
  };
}

