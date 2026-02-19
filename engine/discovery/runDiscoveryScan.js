/**
 * DISCOVERY LAB — AUTONOMOUS SCAN (D14.5)
 * - Calls runDiscoveryEngine per-symbol (correct contract)
 * - Fetches live price + company name for each symbol
 * - Lowers conviction threshold so momentum-only tickers surface
 * - AVOID decisions suppressed from surfaced
 */

const https = require("https");
const { buildDiscoveryUniverse } = require("./universe/buildDiscoveryUniverse.js");
const { runDiscoveryEngine }     = require("./discoveryEngine.js");
const { rankDiscoveryResults }   = require("./ranking/rankDiscoveryResults.js");
const { compareRegimeRankings }  = require("./ranking/compareRegimeRankings.js");
const { analyzeRegimeDeltas }    = require("./ranking/regimeDeltaAnalysis.js");

const POLYGON_KEY = process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

const SURFACING_CONFIG = Object.freeze({
  SURFACE_MIN_CONVICTION: 0.30,
  PREVIEW_MIN_CONVICTION: 0.20,
  MAX_SURFACED: 10,
  MAX_PREVIEW:  10,
});

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

// Fetch price + company name for a symbol
async function fetchSymbolMeta(symbol) {
  const ticker = symbol.endsWith(".TO") ? symbol.replace(".TO", "") : symbol;

  const [priceData, detailData] = await Promise.all([
    fetchJson(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`),
    fetchJson(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${POLYGON_KEY}`),
  ]);

  const bar  = priceData?.results?.[0];
  const info = detailData?.results;

  return {
    symbol,
    price:       bar?.c  ?? null,
    priceOpen:   bar?.o  ?? null,
    priceHigh:   bar?.h  ?? null,
    priceLow:    bar?.l  ?? null,
    volume:      bar?.v  ?? null,
    companyName: info?.name ?? symbol,
    market:      info?.primary_exchange ?? "US",
    currency:    info?.currency_name?.toUpperCase() ?? "USD",
  };
}

async function runDiscoveryScan() {
  const telemetry = {
    universeRawCount: 0,
    universeNormalizedCount: 0,
    evaluatedCount: 0,
    rankedCount: 0,
    surfacedCount: 0,
    previewCount: 0,
    rejectedCount: 0,
    gating: {},
    notes: [],
  };

  // ---- BUILD UNIVERSE ----
  const rawUniverse = await buildDiscoveryUniverse();

  telemetry.universeRawCount =
    rawUniverse?.telemetry?.rawSnapshotCount ??
    rawUniverse?.universe?.length ?? 0;

  telemetry.gating.volumeFloorUsed =
    rawUniverse?.telemetry?.volumeFloorUsed ?? null;

  const universe = (rawUniverse?.universe || [])
    .map(u => {
      if (typeof u === "string") return { symbol: u, tags: [], ownership: false };
      if (u && typeof u.symbol === "string") return { symbol: u.symbol, tags: u.tags || [], ownership: u.ownership || false };
      return null;
    })
    .filter(Boolean);

  telemetry.universeNormalizedCount = universe.length;

  if (universe.length === 0) {
    telemetry.notes.push("Universe empty.");
    return Object.freeze({ canonical: [], preview: [], rejected: [], comparativeByRegime: {}, regimeDeltas: [], telemetry });
  }

  // ---- FETCH PRICE + NAME IN PARALLEL ----
  const metaMap = {};
  await Promise.all(
    universe.map(async entry => {
      try {
        metaMap[entry.symbol] = await fetchSymbolMeta(entry.symbol);
      } catch {
        metaMap[entry.symbol] = { symbol: entry.symbol, price: null, companyName: entry.symbol };
      }
    })
  );

  // ---- EVALUATE — one symbol at a time ----
  const evaluated = [];
  for (const entry of universe) {
    try {
      const result = await runDiscoveryEngine({
        symbol:    entry.symbol,
        ownership: entry.ownership || false,
      });
      if (result) {
        // Attach price + name to result
        const meta = metaMap[entry.symbol] || {};
        evaluated.push({
          ...result,
          price:       meta.price,
          companyName: meta.companyName,
          market:      meta.market,
          currency:    meta.currency,
          volume:      meta.volume,
        });
      }
    } catch (e) {
      telemetry.notes.push(`${entry.symbol}: skipped (${e.message})`);
    }
  }

  telemetry.evaluatedCount = evaluated.length;

  if (evaluated.length === 0) {
    telemetry.notes.push("No symbols evaluated successfully.");
    return Object.freeze({ canonical: [], preview: [], rejected: [], comparativeByRegime: {}, regimeDeltas: [], telemetry });
  }

  // ---- RANK ----
  const ranked = rankDiscoveryResults(evaluated);
  telemetry.rankedCount = ranked.length;
  const canonicalRanked = ranked.map((r, i) => ({ ...r, rank: i + 1 }));

  // ---- SURFACE ----
  const surfaced = canonicalRanked
    .filter(r =>
      r.conviction?.normalized >= SURFACING_CONFIG.SURFACE_MIN_CONVICTION &&
      r.decision?.decision !== "AVOID"
    )
    .slice(0, SURFACING_CONFIG.MAX_SURFACED)
    .map(r => Object.freeze({
      symbol:      r.symbol,
      companyName: r.companyName ?? r.symbol,
      price:       r.price,
      market:      r.market,
      currency:    r.currency,
      volume:      r.volume,
      conviction:  r.conviction,
      decision:    r.decision,
      regime:      r.regime,
      rank:        r.rank,
      explanation: r.explanation,
    }));

  telemetry.surfacedCount = surfaced.length;

  // ---- PREVIEW ----
  const surfacedSymbols = new Set(surfaced.map(r => r.symbol));
  const preview = canonicalRanked
    .filter(r =>
      !surfacedSymbols.has(r.symbol) &&
      r.conviction?.normalized >= SURFACING_CONFIG.PREVIEW_MIN_CONVICTION &&
      r.decision?.decision !== "AVOID"
    )
    .slice(0, SURFACING_CONFIG.MAX_PREVIEW)
    .map(r => Object.freeze({
      symbol:        r.symbol,
      companyName:   r.companyName ?? r.symbol,
      price:         r.price,
      conviction:    r.conviction,
      decision:      r.decision,
      regime:        r.regime,
      rank:          r.rank,
      previewReason: "Near-miss: conviction below surfacing threshold.",
    }));

  telemetry.previewCount = preview.length;

  // ---- REJECTION EXPOSURE ----
  const allShown = new Set([...surfaced.map(r => r.symbol), ...preview.map(r => r.symbol)]);
  const rejected = canonicalRanked
    .filter(r => !allShown.has(r.symbol))
    .map(r => Object.freeze({
      symbol:          r.symbol,
      companyName:     r.companyName ?? r.symbol,
      price:           r.price,
      rank:            r.rank,
      conviction:      r.conviction,
      decision:        r.decision,
      rejectionReason:
        r.decision?.decision === "AVOID"
          ? "Explicit AVOID decision"
          : r.conviction?.normalized < SURFACING_CONFIG.SURFACE_MIN_CONVICTION
          ? "Conviction below surfacing threshold"
          : "Did not pass final surfacing gate",
    }));

  telemetry.rejectedCount = rejected.length;

  const comparativeByRegime = compareRegimeRankings(evaluated);
  const deltas = analyzeRegimeDeltas({ canonical: canonicalRanked, comparativeByRegime });

  return Object.freeze({ canonical: surfaced, preview, rejected, comparativeByRegime, regimeDeltas: deltas, telemetry });
}

module.exports = Object.freeze({ runDiscoveryScan });
