/**
 * Risk Engine — V1 (PURE, DERIVED)
 * --------------------------------
 * Input: Authoritative Portfolio Snapshot
 * Output: Derived Risk Snapshot
 * No IO, no IPC, no globals
 */

export function computeRiskSnapshot(portfolio) {
  if (!portfolio || !portfolio.positions || !portfolio.totals) {
    return { available: false };
  }

  const totalValue = portfolio.totals.totalValue || 0;
  if (totalValue <= 0) {
    return { available: false };
  }

  const ranked = portfolio.positions
    .map(p => ({
      symbol: p.symbol,
      value: p.liveValue || 0,
      pct: (p.liveValue || 0) / totalValue
    }))
    .sort((a, b) => b.value - a.value);

  const equityValue = portfolio.positions
    .filter(p => p.assetClass === "equity")
    .reduce((s, p) => s + (p.liveValue || 0), 0);

  const cryptoValue = portfolio.positions
    .filter(p => p.assetClass === "crypto")
    .reduce((s, p) => s + (p.liveValue || 0), 0);

  const equityPct = equityValue / totalValue;
  const cryptoPct = cryptoValue / totalValue;

  return {
    available: true,
    asOf: Date.now(),
    totals: {
      totalValue,
      equityPct,
      cryptoPct
    },
    contributors: {
      ranked,
      top1: ranked.slice(0, 1),
      top3: ranked.slice(0, 3)
    },
    bands: {
      cryptoExposure: cryptoPct >= 0.30 ? "ELEVATED" : "NORMAL"
    },
    flags: {
      highCryptoExposure: cryptoPct >= 0.50,
      highConcentration: ranked[0]?.pct >= 0.50
    }
  };
}

