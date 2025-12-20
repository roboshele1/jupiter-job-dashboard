/**
 * Deterministic portfolio analytics (v1)
 * Read-only derived metrics from priced snapshot
 */

function computeAnalytics(snapshot) {
  const positions = snapshot.positions || [];
  const totalValue = snapshot.totalValue || 0;

  const enriched = positions.map(p => {
    const marketValue = p.marketValue || 0;
    const costBasis = p.costBasis ?? null;

    let plAbs = null;
    let plPct = null;

    if (typeof costBasis === "number" && costBasis > 0) {
      plAbs = marketValue - costBasis;
      plPct = (plAbs / costBasis) * 100;
    }

    const allocationPct =
      totalValue > 0 ? (marketValue / totalValue) * 100 : 0;

    return {
      ...p,
      plAbs,
      plPct,
      allocationPct
    };
  });

  const totalCostBasis = enriched.reduce(
    (s, p) => s + (p.costBasis || 0),
    0
  );

  const totalPLAbs =
    typeof totalCostBasis === "number"
      ? totalValue - totalCostBasis
      : null;

  const totalPLPct =
    totalCostBasis > 0 ? (totalPLAbs / totalCostBasis) * 100 : null;

  return {
    ...snapshot,
    analytics: {
      totalCostBasis,
      totalPLAbs,
      totalPLPct
    },
    positions: enriched
  };
}

module.exports = { computeAnalytics };

