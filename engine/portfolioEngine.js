// portfolioEngine.js
// V1 institutional portfolio engine (read-only)

export function buildPortfolioSnapshot(holdings = []) {
  if (!Array.isArray(holdings)) holdings = [];

  const enriched = holdings.map(h => ({
    ...h,
    quantity: Number(h.quantity) || 0,
    price: Number(h.price) || 0,
    value: (Number(h.quantity) || 0) * (Number(h.price) || 0)
  }));

  const totalValue = enriched.reduce((sum, h) => sum + h.value, 0);

  const topHoldings = [...enriched]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    holdings: enriched,
    totalValue,
    topHoldings,
    timestamp: new Date().toISOString()
  };
}

