/**
 * JUPITER — Portfolio Snapshot Engine (CANONICAL)
 * STEP 3B.1 — HARD SNAPSHOT AUTHORITY LOCK
 *
 * This file is the SINGLE SOURCE OF TRUTH for holdings.
 * UI, allocation, dashboard, and analytics MUST consume this output.
 *
 * ⚠️ BTC + ETH ARE HARD-ENFORCED HERE.
 */

const priceService = require("./priceService");

/**
 * Canonical holdings — DO NOT MUTATE AT RUNTIME
 */
const CANONICAL_POSITIONS = Object.freeze([
  { symbol: "NVDA", qty: 73, type: "equity" },
  { symbol: "AVGO", qty: 74, type: "equity" },
  { symbol: "ASML", qty: 10, type: "equity" },
  { symbol: "MSTR", qty: 24, type: "equity" },
  { symbol: "HOOD", qty: 70, type: "equity" },
  { symbol: "APLD", qty: 150, type: "equity" },
  { symbol: "BMNR", qty: 115, type: "equity" },

  // 🔒 CRYPTO — HARD LOCKED
  { symbol: "BTC", qty: 0.251, type: "crypto" },
  { symbol: "ETH", qty: 0.25, type: "crypto" }
]);

/**
 * Build snapshot — ALWAYS RETURNS ALL 9 POSITIONS
 */
async function getPortfolioSnapshot() {
  const prices = await priceService.getPrices(
    CANONICAL_POSITIONS.map(p => p.symbol)
  );

  let totalValue = 0;
  let equityValue = 0;
  let cryptoValue = 0;

  const positions = CANONICAL_POSITIONS.map(p => {
    const price = prices[p.symbol] ?? 0;
    const marketValue = price * p.qty;

    totalValue += marketValue;

    if (p.type === "crypto") {
      cryptoValue += marketValue;
    } else {
      equityValue += marketValue;
    }

    return {
      symbol: p.symbol,
      qty: p.qty,
      price,
      marketValue,
      type: p.type
    };
  });

  // Allocation normalization (ENGINE LEVEL)
  positions.forEach(p => {
    p.allocationPct = totalValue > 0 ? p.marketValue / totalValue : 0;
  });

  return {
    contract: "JUPITER_PORTFOLIO_SNAPSHOT_V1_CANONICAL",
    timestamp: Date.now(),
    currency: "USD",
    totalValue,
    equityValue,
    cryptoValue,
    equityPct: totalValue ? equityValue / totalValue : 0,
    cryptoPct: totalValue ? cryptoValue / totalValue : 0,
    positions
  };
}

module.exports = {
  getPortfolioSnapshot
};

