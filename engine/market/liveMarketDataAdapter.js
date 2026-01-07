/**
 * D8.0.2 — Entitlement-Aware Live Market Data Adapter
 * --------------------------------------------------
 * Purpose:
 * Single authoritative market pricing ingress with tier-aware fallback.
 *
 * Behavior:
 * - Attempts LAST_TRADE (if entitled)
 * - Falls back to PREVIOUS_CLOSE when unavailable
 *
 * Guarantees:
 * - Read-only
 * - Deterministic snapshot per invocation
 * - Explicit priceType labeling
 * - Engine-only (no renderer access)
 */

const https = require("https");

const SOURCE = "polygon";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchLastTrade(symbol, apiKey) {
  const url = `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${apiKey}`;
  const data = await fetchJSON(url);
  return data?.results?.p ?? null;
}

async function fetchPrevClose(symbol, apiKey) {
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${apiKey}`;
  const data = await fetchJSON(url);
  return data?.results?.[0]?.c ?? null;
}

async function getLiveQuotes(symbols = []) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error("LIVE_DATA: symbols array required");
  }

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error("LIVE_DATA: missing POLYGON_API_KEY");
  }

  const timestamp = new Date().toISOString();
  const results = [];

  for (const symbol of symbols) {
    let price = null;
    let priceType = "UNKNOWN";

    // Attempt last trade (may be null on lower tiers)
    const lastTradePrice = await fetchLastTrade(symbol, apiKey);

    if (Number.isFinite(lastTradePrice)) {
      price = lastTradePrice;
      priceType = "LAST_TRADE";
    } else {
      const prevClosePrice = await fetchPrevClose(symbol, apiKey);
      if (Number.isFinite(prevClosePrice)) {
        price = prevClosePrice;
        priceType = "PREV_CLOSE";
      }
    }

    results.push(
      Object.freeze({
        symbol,
        price,
        priceType,
        source: SOURCE,
        fetchedAt: timestamp,
      })
    );
  }

  return Object.freeze({
    source: SOURCE,
    fetchedAt: timestamp,
    quotes: Object.freeze(results),
  });
}

module.exports = Object.freeze({
  getLiveQuotes,
});

