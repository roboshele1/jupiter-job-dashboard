/**
 * V1 CANONICAL HOLDINGS AUTHORITY (SINGLE SOURCE OF TRUTH)
 * DO NOT import holdings from anywhere else in V1.
 *
 * Rules:
 * - Exactly one file defines holdings: engine/data/holdings.v1.js
 * - Every engine consumer must require THIS file only.
 */

module.exports = [
  // Equities
  { symbol: "NVDA", qty: 73, assetClass: "equity" },
  { symbol: "AVGO", qty: 74, assetClass: "equity" },
  { symbol: "ASML", qty: 10, assetClass: "equity" },
  { symbol: "MSTR", qty: 24, assetClass: "equity" },
  { symbol: "HOOD", qty: 70, assetClass: "equity" },
  { symbol: "APLD", qty: 150, assetClass: "equity" },
  { symbol: "BMNR", qty: 115, assetClass: "equity" },

  // Crypto
  { symbol: "BTC", qty: 0.251, assetClass: "crypto" },
  { symbol: "ETH", qty: 0.25, assetClass: "crypto" },
];

