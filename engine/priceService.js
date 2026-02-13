// engine/priceService.js
// ----------------------------------------------------
// D2 — Equity Price Authority (Polygon) + Crypto (Coinbase)
// READ-ONLY • Deterministic pricing contract
//
// Responsibilities:
// - Provide live crypto pricing via Coinbase
// - Provide live equity pricing via Polygon
// - Return flat price map for downstream engines
//
// Rules:
// - No signal logic
// - No forecasting
// - No mutation of inputs
// - Deterministic fallbacks (price = null when unavailable)
// ----------------------------------------------------

import axios from "axios";

/* =========================================================
   CONFIG
========================================================= */

const COINBASE_BASE = "https://api.coinbase.com/v2/prices";
const POLYGON_BASE = "https://api.polygon.io/v2/last/trade";

/* =========================================================
   CRYPTO — COINBASE
========================================================= */

async function fetchCoinbasePrice(symbol) {
  try {
    const pair = `${symbol}-USD`;
    const r = await axios.get(`${COINBASE_BASE}/${pair}/spot`);
    const amount = Number(r?.data?.data?.amount);
    return Number.isFinite(amount) ? amount : null;
  } catch {
    return null;
  }
}

/* =========================================================
   EQUITIES — POLYGON
========================================================= */

async function fetchPolygonPrice(symbol) {
  try {
    const key = process.env.POLYGON_API_KEY;
    if (!key) return null;

    const r = await axios.get(
      `${POLYGON_BASE}/${symbol}?apiKey=${key}`
    );

    const price = Number(r?.data?.results?.p);
    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

/* =========================================================
   PRICE RESOLUTION
========================================================= */

/**
 * getPrices
 * Returns a flat symbol → price map.
 *
 * Example output:
 * {
 *   NVDA: 712.45,
 *   AVGO: 1388.10,
 *   BTC: 66201.99
 * }
 */
export async function getPrices(symbols = []) {
  const out = {};
  const unique = Array.from(new Set(symbols));

  for (const s of unique) {
    // CRYPTO PATH
    if (s === "BTC" || s === "ETH") {
      out[s] = await fetchCoinbasePrice(s);
      continue;
    }

    // EQUITY PATH
    out[s] = await fetchPolygonPrice(s);
  }

  return out;
}
