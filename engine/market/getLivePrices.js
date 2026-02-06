// engine/market/getLivePrices.js
// D8.6 — Source-aware price routing (INTRADAY-ENABLED, HARDENED)
// -------------------------------------------------------------
// Equity  → Polygon intraday (15-min delayed) → fallback prev close
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
   TIME HELPERS
   ========================= */
function oneHourWindow() {
  const end = Date.now();
  const start = end - 60 * 60 * 1000;
  return { start, end };
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
    // EQUITY → POLYGON
    // Priority: intraday → prev close
    // -----------------------------
    if (!POLYGON_KEY) {
      prices[symbol] = Object.freeze({
        price: null,
        source: "polygon-unavailable",
      });
      continue;
    }

    // ---- 1️⃣ INTRADAY (15-min delayed, minute bars)
    const { start, end } = oneHourWindow();
    const intraday = await safeFetchJSON(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${start}/${end}?adjusted=true&limit=1&apiKey=${POLYGON_KEY}`
    );

    const intradayPrice = intraday?.results?.[0]?.c;
    if (typeof intradayPrice === "number") {
      prices[symbol] = Object.freeze({
        price: intradayPrice,
        source: "polygon-intraday-delayed",
      });
      continue;
    }

    // ---- 2️⃣ FALLBACK → PREV CLOSE
    const prev = await safeFetchJSON(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
    );

    const close = prev?.results?.[0]?.c;

    prices[symbol] = Object.freeze({
      price: typeof close === "number" ? close : null,
      source: prev ? "polygon-prev-close" : "polygon-unavailable",
    });
  }

  return Object.freeze(prices);
}
