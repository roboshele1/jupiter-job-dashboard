/**
 * Global Universe Adapter
 * --------------------------------------------------
 * Builds an unconstrained global equity universe
 * across exchanges, sectors, and market caps.
 *
 * PURPOSE:
 * - Moonshot discovery (pre-consensus)
 * - Small, mid, large, micro-cap inclusive
 * - No portfolio, sector, or liquidity bias
 *
 * HARD RULES:
 * - Universe selection ONLY
 * - No filtering by cap, price, or volume
 * - No scan logic, scoring, or telemetry changes
 */

const fetch = require("node-fetch");

const BASE_URL = "https://api.polygon.io";

/**
 * Resolve API key at call-time (not module load)
 * Prevents env timing issues in Electron / Node
 */
function getApiKey() {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error("POLYGON_API_KEY missing from environment");
  }
  return key;
}

/**
 * Fetch one page of tickers
 */
async function fetchTickerPage(cursor = null) {
  const apiKey = getApiKey();

  const url =
    `${BASE_URL}/v3/reference/tickers` +
    `?market=stocks` +
    `&active=true` +
    `&limit=1000` +
    (cursor ? `&cursor=${cursor}` : ``) +
    `&apiKey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Polygon error ${res.status}`);
  }

  return res.json();
}

/**
 * BUILD GLOBAL UNIVERSE
 * -----------------------------------------
 * Returns ALL available equity tickers
 * (typically 20k–30k symbols)
 */
async function fetchTickerPageOtc(market, cursor = null) {
  const apiKey = getApiKey();
  const url =
    `${BASE_URL}/v3/reference/tickers` +
    `?market=${market}` +
    `&active=true` +
    `&limit=1000` +
    (cursor ? `&cursor=${cursor}` : ``) +
    `&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return { results: [], next_url: null };
  return res.json();
}

async function buildMarketUniverse(market) {
  let all = [];
  let cursor = null;
  while (true) {
    const page = await fetchTickerPageOtc(market, cursor);
    if (Array.isArray(page.results)) {
      all.push(...page.results.map(t => ({
        symbol: t.ticker,
        exchange: t.primary_exchange || "UNKNOWN",
        market: t.market || market,
        type: t.type || "equity"
      })));
    }
    if (!page.next_url) break;
    const next = new URL(page.next_url);
    cursor = next.searchParams.get("cursor");
    if (!cursor) break;
  }
  return all;
}

async function buildGlobalUniverse() {
  // Fetch US stocks + OTC in parallel, then deduplicate
  const [usStocks, otcStocks] = await Promise.allSettled([
    buildMarketUniverse("stocks"),
    buildMarketUniverse("otc"),
  ]);

  const us  = usStocks.status  === "fulfilled" ? usStocks.value  : [];
  const otc = otcStocks.status === "fulfilled" ? otcStocks.value : [];

  // Deduplicate by symbol — US exchange listing takes priority
  const seen = new Set();
  const all  = [];
  for (const t of [...us, ...otc]) {
    if (!seen.has(t.symbol)) {
      seen.add(t.symbol);
      all.push(t);
    }
  }

  // Append TSX-listed symbols via Polygon exchange filter
  try {
    const apiKey = getApiKey();
    const tsxUrl = `${BASE_URL}/v3/reference/tickers?market=stocks&exchange=XTSE&active=true&limit=1000&apiKey=${apiKey}`;
    const tsxRes = await fetch(tsxUrl);
    if (tsxRes.ok) {
      const tsxData = await tsxRes.json();
      if (Array.isArray(tsxData.results)) {
        for (const t of tsxData.results) {
          if (!seen.has(t.ticker)) {
            seen.add(t.ticker);
            all.push({
              symbol: t.ticker,
              exchange: "XTSE",
              market: "stocks",
              type: t.type || "equity"
            });
          }
        }
      }
    }
  } catch (_) { /* TSX fetch failed — continue with US universe */ }

  return all;
}

module.exports = {
  buildGlobalUniverse
};
