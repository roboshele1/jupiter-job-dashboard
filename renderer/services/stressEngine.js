/**
 * Stress Engine
 * Computes per-asset stress impacts and attribution
 */

export function computeStress(portfolio) {
  const scenarios = {
    mild: 0.9,
    moderate: 0.75,
    severe: 0.6
  };

  const perAsset = portfolio.holdings.map((h) => {
    const stressed = {};
    Object.entries(scenarios).forEach(([k, factor]) => {
      stressed[k] = {
        stressedValue: h.marketValue * factor,
        drawdown: h.marketValue * (1 - factor),
        drawdownPct: (1 - factor) * 100
      };
    });

    return {
      symbol: h.symbol,
      allocationPct: h.allocationPct,
      marketValue: h.marketValue,
      stressed
    };
  });

  // Attribution: which assets contribute most to severe drawdown
  const severeAttribution = perAsset
    .map((a) => ({
      symbol: a.symbol,
      contribution: a.stressed.severe.drawdown
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const totalSevereDrawdown = severeAttribution.reduce(
    (s, a) => s + a.contribution,
    0
  );

  const attributionPct = severeAttribution.map((a) => ({
    symbol: a.symbol,
    pct: totalSevereDrawdown
      ? (a.contribution / totalSevereDrawdown) * 100
      : 0
  }));

  return {
    scenarios,
    perAsset,
    severeAttribution: attributionPct
  };
}

