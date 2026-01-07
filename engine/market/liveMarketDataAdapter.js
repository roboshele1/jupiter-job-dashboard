/**
 * LIVE_MARKET_DATA_ADAPTER_V1
 * ---------------------------
 * Authoritative live / near-live market price ingress.
 *
 * Guarantees:
 * - Read-only
 * - Deterministic snapshot per invocation
 * - Engine-only (no renderer access)
 * - Explicit source + timestamp
 */

import https from "https";

const SOURCE = "polygon";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
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

export async function getLiveQuotes(symbols = []) {
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
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`;
    const data = await fetchJSON(url);

    const price = data?.results?.[0]?.c ?? null;

    results.push(
      Object.freeze({
        symbol,
        price,
        priceType: "PREV_CLOSE",
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

