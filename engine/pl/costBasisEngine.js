// engine/pl/costBasisEngine.js
export function applyCostBasis(valuation, costMap) {
  const enriched = valuation.breakdown.map(b => {
    const cost = costMap[b.symbol] ?? null;
    const pnl = cost !== null ? (b.price - cost) * b.quantity : null;
    const pnlPct = cost !== null ? ((b.price - cost) / cost) * 100 : null;

    return {
      ...b,
      avgCost: cost,
      pnl,
      pnlPct
    };
  });

  return {
    ...valuation,
    breakdown: enriched
  };
}

