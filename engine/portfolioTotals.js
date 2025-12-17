/**
 * JUPITER v1 — Portfolio Totals Engine
 * Computes all portfolio-level totals deterministically.
 * All numbers must reconcile with positions.
 */

function computeTotals(positions) {
  let totalValue = 0;
  let cryptoValue = 0;
  let equitiesValue = 0;
  let totalUnrealizedPnL = 0;

  for (const p of positions) {
    totalValue += p.marketValue;

    if (p.assetClass === "CRYPTO") {
      cryptoValue += p.marketValue;
    }

    if (p.assetClass === "EQUITY") {
      equitiesValue += p.marketValue;
    }

    totalUnrealizedPnL += p.unrealizedPnL;
  }

  const totalUnrealizedPnLPct =
    totalValue > 0
      ? totalUnrealizedPnL / (totalValue - totalUnrealizedPnL)
      : 0;

  return {
    totalValue,
    cryptoValue,
    equitiesValue,
    totalUnrealizedPnL,
    totalUnrealizedPnLPct
  };
}

module.exports = {
  computeTotals
};

