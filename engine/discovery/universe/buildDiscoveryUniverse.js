/**
 * DISCOVERY UNIVERSE — DYNAMIC FULL MARKET
 * Pulls entire US market via Polygon grouped daily.
 * Also fetches Canadian TSX top movers via Polygon.
 * No hardcoded symbols. Holdings read from holdings.json.
 */

const https = require("https");
const fs    = require("fs");
const path  = require("path");

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";
const HOLDINGS_PATH   = path.resolve(__dirname, "../../data/users/default/holdings.json");

const MIN_PRICE    = 5;
const MIN_VOLUME   = 500_000;
const MAX_EXTERNAL = 150;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on("error", reject);
  });
}

function loadHoldingSymbols() {
  try {
    return JSON.parse(fs.readFileSync(HOLDINGS_PATH, "utf-8"))
      .map(h => h.symbol?.toUpperCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function getPrevBusinessDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

async function fetchUSMarket(date) {
  try {
    const url  = `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const resp = await fetchJson(url);
    return (resp?.results || []).map(t => ({ ...t, market: "US" }));
  } catch(err) {
    console.error("[buildDiscoveryUniverse] US fetch failed:", err.message);
    return [];
  }
}

async function fetchCanadianMarket(date) {
  try {
    const url  = `https://api.polygon.io/v2/aggs/grouped/locale/global/market/stocks/${date}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const resp = await fetchJson(url);
    // Filter to TSX-listed (Polygon uses suffix format like CSU.TSX or just includes them)
    return (resp?.results || [])
      .filter(t => t.T && (t.T.includes(":") || t.T.endsWith(".TSX")))
      .map(t => ({ ...t, market: "CA" }));
  } catch(err) {
    console.error("[buildDiscoveryUniverse] Canadian fetch failed:", err.message);
    return [];
  }
}

async function buildDiscoveryUniverse() {
  const holdingSymbols = loadHoldingSymbols();
  const date = getPrevBusinessDate();

  const [usTickers, caTickers] = await Promise.all([
    fetchUSMarket(date),
    fetchCanadianMarket(date),
  ]);

  const allTickers = [...usTickers, ...caTickers];

  // Filter by liquidity
  const liquid = allTickers.filter(t =>
    t.c >= MIN_PRICE &&
    t.v >= MIN_VOLUME &&
    t.T &&
    !t.T.includes(".")
  );

  // Score by absolute momentum
  const scored = liquid.map(t => ({
    symbol:   t.T,
    momentum: t.o > 0 ? (t.c - t.o) / t.o : 0,
    volume:   t.v,
    price:    t.c,
    market:   t.market || "US",
    tags:     [],
  })).sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum));

  // Top external movers
  const external = scored
    .filter(t => !holdingSymbols.includes(t.symbol))
    .slice(0, MAX_EXTERNAL);

  // Always include holdings
  const holdingEntries = holdingSymbols.map(symbol => {
    const match = scored.find(t => t.symbol === symbol);
    return match || { symbol, momentum: 0, volume: 0, price: 0, market: "US", tags: [] };
  });

  const universe = [...holdingEntries, ...external];

  console.log(`[buildDiscoveryUniverse] ${holdingEntries.length} holdings + ${external.length} market movers = ${universe.length} total (US: ${usTickers.length} raw, CA: ${caTickers.length} raw)`);

  return {
    universe,
    telemetry: {
      rawSnapshotCount:     allTickers.length,
      afterLiquidityFilter: liquid.length,
      universeSize:         universe.length,
      holdingsCount:        holdingEntries.length,
      externalCount:        external.length,
      volumeFloorUsed:      MIN_VOLUME,
      date,
    }
  };
}

module.exports = Object.freeze({ buildDiscoveryUniverse });
