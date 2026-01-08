/**
 * LIVE FUNDAMENTALS SERVICE (D16.3 — MULTI-PERIOD)
 * -----------------------------------------------
 * - Fetches multi-period fundamentals from Polygon
 * - Preserves TTM snapshot
 * - Enables YoY / TTM growth calculations upstream
 *
 * GUARANTEES:
 * - Read-only
 * - Deterministic
 * - Cache-protected
 * - Desktop-safe
 */

require("dotenv").config();

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const fundamentalsCache = new Map();
const POLYGON_BASE = "https://api.polygon.io";

function requirePolygonKey() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error("POLYGON_API_KEY_MISSING_AT_ENGINE_LAYER");
  }
  return key;
}

/**
 * Fetch multiple financial periods from Polygon
 */
async function fetchFundamentalsHistoryFromPolygon(symbol) {
  const apiKey = requirePolygonKey();

  const url =
    `${POLYGON_BASE}/vX/reference/financials` +
    `?ticker=${symbol}&limit=5&apiKey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`POLYGON_FINANCIALS_FETCH_FAILED (${symbol})`);
  }

  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : [];
}

/**
 * Public — Multi-period fundamentals
 */
async function getFundamentalsHistory(symbol) {
  const now = Date.now();
  const cached = fundamentalsCache.get(symbol);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.history;
  }

  const history = await fetchFundamentalsHistoryFromPolygon(symbol);

  fundamentalsCache.set(symbol, {
    timestamp: now,
    history,
    ttm: history[0] || null,
  });

  return history;
}

/**
 * Public — Backwards-compatible TTM fundamentals
 */
async function getLiveFundamentals(symbol) {
  const history = await getFundamentalsHistory(symbol);
  return history[0] || null;
}

module.exports = Object.freeze({
  getLiveFundamentals,
  getFundamentalsHistory, // ← NEW (D16.3)
});
