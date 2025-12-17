/**
 * JUPITER — Portfolio Source (Truth Layer)
 * ---------------------------------------
 * Canonical holdings source based on the user’s verified Excel portfolio.
 * No prices. No calculations. No mocks. No UI assumptions.
 */

function getRawHoldings() {
  return [
    // ===== EQUITIES =====
    { symbol: "ASML", assetClass: "EQUITY", quantity: 10, costBasis: 0 },
    { symbol: "NVDA", assetClass: "EQUITY", quantity: 73, costBasis: 0 },
    { symbol: "AVGO", assetClass: "EQUITY", quantity: 80, costBasis: 0 },
    { symbol: "MSTR", assetClass: "EQUITY", quantity: 25, costBasis: 0 },
    { symbol: "HOOD", assetClass: "EQUITY", quantity: 35, costBasis: 0 },
    { symbol: "BMNR", assetClass: "EQUITY", quantity: 115, costBasis: 0 },
    { symbol: "APLD", assetClass: "EQUITY", quantity: 150, costBasis: 0 },

    // ===== CRYPTO =====
    { symbol: "BTC", assetClass: "CRYPTO", quantity: 0.251083, costBasis: 0 },
    { symbol: "ETH", assetClass: "CRYPTO", quantity: 0.25, costBasis: 0 }
  ];
}

module.exports = {
  getRawHoldings
};

