// electron/api/marketDataService.js
// CANONICAL SNAPSHOT AUTHORITY — V1 LOCK
// DO NOT FILTER POSITIONS ANYWHERE ELSE

const CANONICAL_HOLDINGS = [
  { symbol: "NVDA", qty: 73, type: "equity" },
  { symbol: "AVGO", qty: 74, type: "equity" },
  { symbol: "ASML", qty: 10, type: "equity" },
  { symbol: "MSTR", qty: 24, type: "equity" },
  { symbol: "HOOD", qty: 70, type: "equity" },
  { symbol: "APLD", qty: 150, type: "equity" },
  { symbol: "BMNR", qty: 115, type: "equity" },
  { symbol: "BTC", qty: 0.251, type: "crypto" },
  { symbol: "ETH", qty: 0.25, type: "crypto" }
];

// TEMP PRICE SOURCE — STABLE V1
// (Live pricing comes later — do NOT refactor this in V1)
const PRICE_MAP = {
  NVDA: 170.94,
  AVGO: 326.17,
  ASML: 1015.86,
  MSTR: 160.38,
  HOOD: 115.80,
  APLD: 21.97,
  BMNR: 29.31,
  BTC: 86149.00,
  ETH: 2823.93
};

function buildSnapshot() {
  const positions = CANONICAL_HOLDINGS.map(h => {
    const price = PRICE_MAP[h.symbol];
    const marketValue = price * h.qty;

    return {
      symbol: h.symbol,
      qty: h.qty,
      price,
      marketValue,
      type: h.type
    };
  });

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);

  const enriched = positions.map(p => ({
    ...p,
    allocationPct: +(p.marketValue / totalValue * 100).toFixed(2)
  }));

  const equityValue = enriched
    .filter(p => p.type === "equity")
    .reduce((s, p) => s + p.marketValue, 0);

  const cryptoValue = enriched
    .filter(p => p.type === "crypto")
    .reduce((s, p) => s + p.marketValue, 0);

  return {
    contract: "JUPITER_PORTFOLIO_SNAPSHOT_V1_CANONICAL",
    timestamp: Date.now(),
    currency: "USD",
    totalValue: +totalValue.toFixed(2),
    equityValue: +equityValue.toFixed(2),
    cryptoValue: +cryptoValue.toFixed(2),
    equityPct: +(equityValue / totalValue).toFixed(2),
    cryptoPct: +(cryptoValue / totalValue).toFixed(2),
    positions: enriched,
    topHolding: enriched.reduce((a, b) => b.marketValue > a.marketValue ? b : a).symbol
  };
}

module.exports = {
  getPortfolioSnapshot: buildSnapshot
};

