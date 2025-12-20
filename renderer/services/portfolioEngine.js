// renderer/services/portfolioEngine.js

export function computePortfolioTotals(holdings) {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis * h.quantity, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return {
    totalValue,
    totalPL,
    totalPLPct,
  };
}

