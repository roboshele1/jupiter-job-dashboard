/**
 * PORTFOLIO_AUTHORITY_V1
 * Single authoritative portfolio provider for the engine layer.
 *
 * RULES:
 * - Engine-only
 * - No Electron
 * - No IPC
 * - Deterministic
 * - Future IPC wiring happens OUTSIDE the engine
 */

export async function getAuthoritativePortfolio() {
  /**
   * TEMPORARY SOURCE (Phase 4/5)
   * This mirrors the known-good holdings snapshot.
   * Later: this function will be wired to IPC or persisted state.
   */

  return {
    contract: "PORTFOLIO_AUTHORITY_V1",
    currency: "CAD",
    holdings: [
      { symbol: "NVDA", qty: 73, assetClass: "equity", totalCostBasis: 12881.13 },
      { symbol: "ASML", qty: 10, assetClass: "equity", totalCostBasis: 8649.52 },
      { symbol: "AVGO", qty: 74, assetClass: "equity", totalCostBasis: 26190.68 },
      { symbol: "MSTR", qty: 24, assetClass: "equity", totalCostBasis: 12496.18 },
      { symbol: "HOOD", qty: 70, assetClass: "equity", totalCostBasis: 3316.68 },
      { symbol: "BMNR", qty: 115, assetClass: "equity", totalCostBasis: 6320.18 },
      { symbol: "APLD", qty: 150, assetClass: "equity", totalCostBasis: 1615.58 },
      { symbol: "BTC", qty: 0.251083, assetClass: "crypto", totalCostBasis: 24764.31 },
      { symbol: "ETH", qty: 0.25, assetClass: "crypto", totalCostBasis: 597.90 }
    ]
  };
}
