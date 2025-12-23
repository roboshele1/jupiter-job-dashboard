// renderer/services/portfolioSnapshot.js
// READ-ONLY SNAPSHOT ENGINE (V1)
// Deterministic, no IPC, no side effects

/**
 * Static reference prices (V1 baseline)
 * NOT live data
 */
const PRICE_MAP = {
  ASML: 1056.02,
  NVDA: 180.99,
  AVGO: 340.36,
  BTC: 65000,
  ETH: 3500,
  MSTR: 164.82,
  HOOD: 121.35,
  BMNR: 6.25,
  APLD: 7.80,
};

function withMarketValue(holdings = []) {
  return holdings.map((h) => {
    const price = PRICE_MAP[h.symbol] ?? 0;
    const quantity = Number(h.quantity || 0);

    return {
      ...h,
      price,
      marketValue: Number((price * quantity).toFixed(2)),
    };
  });
}

export function getPortfolioSummary(rawHoldings = []) {
  const holdings = withMarketValue(rawHoldings);

  const totalValue = holdings.reduce((a, h) => a + h.marketValue, 0);

  return {
    totalValue: Number(totalValue.toFixed(2)),
    totalPL: 0,
    totalPLPct: 0,
  };
}

export function getPortfolioAllocation(rawHoldings = []) {
  const holdings = withMarketValue(rawHoldings);
  const totalValue = holdings.reduce((a, h) => a + h.marketValue, 0) || 1;

  const buckets = {};

  for (const h of holdings) {
    const type = h.assetType || "Other";
    buckets[type] = (buckets[type] || 0) + h.marketValue;
  }

  Object.keys(buckets).forEach((k) => {
    buckets[k] = Number(((buckets[k] / totalValue) * 100).toFixed(2));
  });

  return buckets;
}

/**
 * 🔒 Explicit export guard
 */
export const __SNAPSHOT_EXPORTS__ = {
  getPortfolioSummary,
  getPortfolioAllocation,
};

