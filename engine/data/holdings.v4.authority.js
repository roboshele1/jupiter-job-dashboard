/**
 * JUPITER — Canonical Holdings + Cost Basis Authority (V4)
 * --------------------------------------------------------
 * This is the single source of truth for:
 * - qty (current holdings)
 * - totalCostBasis (book cost / cost basis)
 * - assetClass
 * - currency
 *
 * NOTE:
 * - These values were provided by the operator (Wealthsimple book cost + current shares).
 * - This file is intentionally explicit and deterministic.
 */

module.exports = [
  { symbol: "ASML", qty: 10, assetClass: "equity", totalCostBasis: 8649.52, currency: "CAD" },
  { symbol: "NVDA", qty: 73, assetClass: "equity", totalCostBasis: 12881.13, currency: "CAD" },
  { symbol: "AVGO", qty: 80, assetClass: "equity", totalCostBasis: 26190.68, currency: "CAD" },

  { symbol: "BTC", qty: 0.275935, assetClass: "crypto", totalCostBasis: 24764.31, currency: "CAD" },
  { symbol: "ETH", qty: 0.25, assetClass: "crypto", totalCostBasis: 597.9, currency: "CAD" },

  { symbol: "MSTR", qty: 40, assetClass: "equity", totalCostBasis: 13398.29, currency: "CAD" },
  { symbol: "HOOD", qty: 35, assetClass: "equity", totalCostBasis: 3316.68, currency: "CAD" },
  { symbol: "BMNR", qty: 165, assetClass: "equity", totalCostBasis: 6320.18, currency: "CAD" },
  { symbol: "APLD", qty: 112, assetClass: "equity", totalCostBasis: 1693.41, currency: "CAD" }
];
