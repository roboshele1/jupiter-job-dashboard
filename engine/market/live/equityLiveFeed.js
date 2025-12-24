/**
 * engine/market/live/equityLiveFeed.js
 * DETERMINISTIC equity price feed (market-closed safe)
 * Purpose: terminal validation + reproducible snapshots
 */

export async function getEquityPrices() {
  return {
    NVDA: { price: 13812.33, source: "mock-equity" },
    ASML: { price: 10618.40, source: "mock-equity" },
    AVGO: { price: 25849.68, source: "mock-equity" },
    MSTR: { price: 3789.12, source: "mock-equity" },
    HOOD: { price: 8416.80, source: "mock-equity" },
    BMNR: { price: 3424.70, source: "mock-equity" },
    APLD: { price: 3912.00, source: "mock-equity" }
  };
}

