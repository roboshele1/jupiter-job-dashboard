// engine/market/marketDataSnapshotEngine.js
// PATCHED — All symbols fetched in parallel via Promise.all (was sequential for loop)

import fetch from "node-fetch";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchEquityHistory(symbol) {
  if (!POLYGON_API_KEY) return null;

  const dailyFrom  = isoDaysAgo(420);
  const weeklyFrom = isoDaysAgo(2200);
  const to = todayISO();

  try {
    const [dailyRes, weeklyRes] = await Promise.all([
      fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${dailyFrom}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`),
      fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/week/${weeklyFrom}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`),
    ]);

    if (!dailyRes.ok || !weeklyRes.ok) return null;

    const [dailyJson, weeklyJson] = await Promise.all([
      dailyRes.json(),
      weeklyRes.json(),
    ]);

    if (!Array.isArray(dailyJson.results) || !Array.isArray(weeklyJson.results)) return null;

    return {
      dailyCloses:  dailyJson.results.map(r => r.c),
      weeklyCloses: weeklyJson.results.map(r => r.c),
      volumes:      dailyJson.results.map(r => r.v),
    };
  } catch {
    return null;
  }
}

export async function fetchHistoricalMarketData(symbols = []) {
  const asOf = new Date().toISOString();

  // ALL symbols fetched in parallel
  const results = await Promise.all(
    symbols.map(symbol =>
      fetchEquityHistory(symbol).then(hist => [symbol, hist])
    )
  );

  const out = Object.fromEntries(
    results.map(([symbol, hist]) => [
      symbol,
      Object.freeze({
        ...(hist || { dailyCloses: [], weeklyCloses: [], volumes: [] }),
        asOf,
        source: hist ? "polygon-historical" : "unavailable",
      })
    ])
  );

  return Object.freeze({
    contract: "MARKETDATA_SNAPSHOT_V1",
    asOf,
    symbols: Object.freeze(out),
  });
}
