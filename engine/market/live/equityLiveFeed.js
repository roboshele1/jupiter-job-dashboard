/**
 * engine/market/live/equityLiveFeed.js
 * LIVE equity price feed (Alpha Vantage)
 * Deterministic output shape
 * Terminal-safe with fallback
 */

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const FALLBACK_PRICES = {
  NVDA: { price: 13812.33, source: "mock-equity" },
  ASML: { price: 10618.40, source: "mock-equity" },
  AVGO: { price: 25849.68, source: "mock-equity" },
  MSTR: { price: 3789.12, source: "mock-equity" },
  HOOD: { price: 8416.80, source: "mock-equity" },
  BMNR: { price: 3424.70, source: "mock-equity" },
  APLD: { price: 3912.00, source: "mock-equity" }
};

export async function getEquityPrices(symbols = []) {
  if (!API_KEY) {
    return FALLBACK_PRICES;
  }

  const results = {};

  for (const symbol of symbols) {
    try {
      const url =
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

      const res = await fetch(url);
      const json = await res.json();

      const raw = json?.["Global Quote"]?.["05. price"];
      const price = raw ? Number(raw) : null;

      if (!price || Number.isNaN(price)) {
        throw new Error("Invalid price");
      }

      results[symbol] = {
        price,
        source: "alpha-vantage"
      };
    } catch {
      results[symbol] = FALLBACK_PRICES[symbol];
    }
  }

  return results;
}

