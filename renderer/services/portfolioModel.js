/**
 * Canonical Portfolio Model
 * Provider-agnostic
 * Deterministic
 */

export const portfolio = [
  {
    symbol: "AAPL",
    assetType: "equity",
    quantity: 10,
    costBasis: 150
  },
  {
    symbol: "NVDA",
    assetType: "equity",
    quantity: 5,
    costBasis: 450
  },
  {
    symbol: "BTC",
    assetType: "crypto",
    quantity: 0.25,
    costBasis: 30000
  }
];

/**
 * Temporary price resolver (mocked)
 * Will be replaced by live data feed
 */
export function resolvePrice(symbol) {
  const mockPrices = {
    AAPL: 190,
    NVDA: 520,
    BTC: 42000
  };

  return mockPrices[symbol] ?? 0;
}

