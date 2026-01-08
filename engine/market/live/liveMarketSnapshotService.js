/**
 * D11.1 — Live Market Snapshot Service (POLYGON · SHADOW MODE)
 * -----------------------------------------------------------
 * Purpose:
 * Ingest real market data using Jupiter’s canonical provider (Polygon)
 * without affecting decisions, rankings, or UI.
 *
 * HARD RULES:
 * - Read-only
 * - Shadow mode only
 * - No decisions consume this yet
 * - No timing, no alerts, no automation
 *
 * This establishes a single source of market truth.
 */

const https = require("https");

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

/**
 * Internal helper — fetch JSON over HTTPS
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Public API — Live Market Snapshot (Polygon)
 * ------------------------------------------
 * Uses previous close data for stability.
 * This matches existing Jupiter valuation logic.
 */
async function getLiveMarketSnapshot({
  symbols = [],
  source = "polygon",
} = {}) {
  if (!Array.isArray(symbols)) {
    throw new Error("INVALID_INPUT: symbols must be an array");
  }

  if (!POLYGON_API_KEY) {
    throw new Error("POLYGON_API_KEY_MISSING");
  }

  const results = [];

  for (const symbol of symbols) {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

    let payload = null;
    try {
      payload = await fetchJson(url);
    } catch {
      payload = null;
    }

    const bar = payload?.results?.[0];

    results.push(
      Object.freeze({
        symbol,
        price: bar?.c ?? null,               // close
        open: bar?.o ?? null,
        high: bar?.h ?? null,
        low: bar?.l ?? null,
        volume: bar?.v ?? null,
        currency: "USD",
        marketState: bar ? "CLOSED" : "UNKNOWN",
        source: "polygon_prev_close",
      })
    );
  }

  return Object.freeze({
    metadata: Object.freeze({
      contract: "LIVE_MARKET_SNAPSHOT_V1",
      mode: "SHADOW",
      provider: "POLYGON",
      generatedAt: new Date().toISOString(),
      symbolCount: symbols.length,
    }),
    data: Object.freeze(results),
    disclaimer:
      "Live market data is ingested in shadow mode using Polygon previous-close aggregates. It does not affect decisions, rankings, or actions.",
  });
}

module.exports = Object.freeze({
  getLiveMarketSnapshot,
});
