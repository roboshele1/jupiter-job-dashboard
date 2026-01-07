// engine/market/getLivePrices.js
// D8.4 — Source-aware price routing
// --------------------------------
// Equity  → Polygon (prev close, plan-safe)
// Crypto  → Coinbase (spot)
// Read-only, deterministic per invocation

import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return res.json();
}

export async function getLivePrices(symbols = []) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error("LIVE_PRICES: symbols array required");
  }

  const prices = {};

  for (const symbol of symbols) {
    // -----------------------------
    // CRYPTO → COINBASE (SPOT)
    // -----------------------------
    if (symbol === "BTC" || symbol === "ETH") {
      const json = await fetchJSON(
        `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
      );

      prices[symbol] = Object.freeze({
        price: Number(json?.data?.amount ?? 0),
        source: "coinbase-spot",
      });

      continue;
    }

    // -----------------------------
    // EQUITY → POLYGON (PREV CLOSE)
    // -----------------------------
    if (!POLYGON_KEY) {
      throw new Error("LIVE_PRICES: missing POLYGON_API_KEY");
    }

    const json = await fetchJSON(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
    );

    const close = json?.results?.[0]?.c ?? 0;

    prices[symbol] = Object.freeze({
      price: Number(close),
      source: "polygon-prev-close",
    });
  }

  return Object.freeze(prices);
}

