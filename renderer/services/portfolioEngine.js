import { portfolio, resolvePrice } from "./portfolioModel";

/**
 * Computes valuation and P/L for a single holding
 */
function valueHolding(holding) {
  const price = resolvePrice(holding.symbol);
  const marketValue = holding.quantity * price;
  const costValue = holding.quantity * holding.costBasis;
  const pnl = marketValue - costValue;
  const pnlPct = costValue ? (pnl / costValue) * 100 : 0;

  return {
    ...holding,
    price,
    marketValue,
    costValue,
    pnl,
    pnlPct
  };
}

/**
 * Canonical portfolio valuation + analytics
 */
export function computePortfolio() {
  const holdings = portfolio.map(valueHolding);

  const totalMarketValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const totalCostValue = holdings.reduce((s, h) => s + h.costValue, 0);

  const totalPnL = totalMarketValue - totalCostValue;
  const totalPnLPct = totalCostValue
    ? (totalPnL / totalCostValue) * 100
    : 0;

  // Allocation %
  const holdingsWithAlloc = holdings.map((h) => ({
    ...h,
    allocationPct: totalMarketValue
      ? (h.marketValue / totalMarketValue) * 100
      : 0
  }));

  // Exposure by asset type
  const exposure = holdingsWithAlloc.reduce(
    (acc, h) => {
      acc[h.assetType] =
        (acc[h.assetType] || 0) + h.allocationPct;
      return acc;
    },
    {}
  );

  // Concentration
  const sortedByAlloc = [...holdingsWithAlloc].sort(
    (a, b) => b.allocationPct - a.allocationPct
  );

  const concentration = {
    top1: sortedByAlloc[0]?.allocationPct || 0,
    top2:
      sortedByAlloc.slice(0, 2).reduce((s, h) => s + h.allocationPct, 0),
    top3:
      sortedByAlloc.slice(0, 3).reduce((s, h) => s + h.allocationPct, 0)
  };

  return {
    holdings: holdingsWithAlloc,
    totalMarketValue,
    totalCostValue,
    totalPnL,
    totalPnLPct,
    exposure,
    concentration
  };
}

