// JUPITER — Live Price Injection
// Phase U — Step 5
// Injects live prices into the portfolio binder using the existing market data layer.
// Deterministic, read-only. No mutations to portfolioStore.

import { fetchQuote } from "../renderer/services/marketData.js";

// Symbols covered by the authoritative portfolio
const SYMBOLS = ["ASML", "NVDA", "AVGO", "MSTR", "HOOD", "BMNR", "APLD", "BTC", "ETH"];

// In-memory price cache (refreshed on demand)
let priceMap = {};

export async function refreshPrices() {
  const results = await Promise.all(
    SYMBOLS.map(async (sym) => {
      try {
        // Crypto pairs handled upstream by marketData when symbol is BTC/ETH
        const q = await fetchQuote(sym);
        return { symbol: sym, price: q?.price ?? 0 };
      } catch {
        return { symbol: sym, price: 0 };
      }
    })
  );

  priceMap = results.reduce((acc, r) => {
    acc[r.symbol] = r.price;
    return acc;
  }, {});
}

export function getPriceMap() {
  return priceMap;
}

