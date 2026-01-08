/**
 * LIVE FUNDAMENTALS HISTORY SERVICE (D16.3)
 * ----------------------------------------
 * Fetches multiple historical financial periods
 * for growth, durability, and trend analysis.
 *
 * ENGINE-ONLY
 * READ-ONLY
 * CACHED
 */

require("dotenv").config();

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const historyCache = new Map();
const POLYGON_BASE = "https://api.polygon.io";

function requirePolygonKey() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error("POLYGON_API_KEY_MISSING_AT_ENGINE_LAYER");
  }
  return key;
}

async function fetchFundamentalsHistory(symbol, limit = 4) {
  const apiKey = requirePolygonKey();

  const url =
    `${POLYGON_BASE}/vX/reference/financials` +
    `?ticker=${symbol}&limit=${limit}&apiKey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`POLYGON_FINANCIALS_HISTORY_FETCH_FAILED (${symbol})`);
  }

  const json = await res.json();
  return json?.results || [];
}

async function getLiveFundamentalsHistory(symbol) {
  const now = Date.now();
  const cached = historyCache.get(symbol);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const data = await fetchFundamentalsHistory(symbol);

  historyCache.set(symbol, {
    timestamp: now,
    data,
  });

  return data;
}

module.exports = Object.freeze({
  getLiveFundamentalsHistory,
});
