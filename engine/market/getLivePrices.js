// engine/market/getLivePrices.js
// D8.5 — Source-aware price routing (HARDENED)
// --------------------------------------------
// Equity  → Polygon (prev close, plan-safe)
// Crypto  → Coinbase (spot)
// Read-only, deterministic, NO THROW guarantee

import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY;

/* =========================
   SAFE FETCH
   ========================= */
async function safeFetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* =========================
   PUBLIC API
   ========================= */
export async function getLivePrices(symbols = []) {
  if (!Array.isArray(symbols)) {
    return Object.freeze({});
  }

  const prices = {};

  for (const symbol of symbols) {
    // -----------------------------
    // CRYPTO → COINBASE (SPOT)
    // -----------------------------
    if (symbol === "BTC" || symbol === "ETH") {
      const json = await safeFetchJSON(
        `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
      );

      prices[symbol] = Object.freeze({
        price: json?.data?.amount ? Number(json.data.amount) : null,
        source: json ? "coinbase-spot" : "unavailable",
      });

      continue;
    }

    // -----------------------------
    // EQUITY → POLYGON (PREV CLOSE)
    // -----------------------------
    if (!POLYGON_KEY) {
      prices[symbol] = Object.freeze({
        price: null,
        source: "polygon-unavailable",
      });
      continue;
    }

    const json = await safeFetchJSON(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
    );

    const close = json?.results?.[0]?.c;

    prices[symbol] = Object.freeze({
      price: typeof close === "number" ? close : null,
      source: json ? "polygon-prev-close" : "polygon-unavailable",
    });
  }

  return Object.freeze(prices);
}
