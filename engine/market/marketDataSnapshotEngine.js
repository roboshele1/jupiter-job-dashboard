// engine/market/marketDataSnapshotEngine.js
// D10.5 — Canonical Market Data Snapshot Engine (POLYGON-STABLE)

import fetch from "node-fetch";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchEquityHistory(symbol) {
  if (!POLYGON_API_KEY) return null;

  const dailyFrom = isoDaysAgo(420);   // ~1.15y
  const weeklyFrom = isoDaysAgo(2200); // ~6y
  const to = todayISO();

  try {
    const dailyUrl =
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${dailyFrom}/${to}` +
      `?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

    const weeklyUrl =
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/week/${weeklyFrom}/${to}` +
      `?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`;

    const [dailyRes, weeklyRes] = await Promise.all([
      fetch(dailyUrl),
      fetch(weeklyUrl),
    ]);

    if (!dailyRes.ok || !weeklyRes.ok) return null;

    const dailyJson = await dailyRes.json();
    const weeklyJson = await weeklyRes.json();

    if (!Array.isArray(dailyJson.results) || !Array.isArray(weeklyJson.results)) {
      return null;
    }

    return {
      dailyCloses: dailyJson.results.map(r => r.c),
      weeklyCloses: weeklyJson.results.map(r => r.c),
      volumes: dailyJson.results.map(r => r.v),
    };
  } catch {
    return null;
  }
}

export async function fetchHistoricalMarketData(symbols = []) {
  const out = {};
  const asOf = new Date().toISOString();

  for (const symbol of symbols) {
    const hist = await fetchEquityHistory(symbol);

    out[symbol] = Object.freeze({
      ...(hist || {
        dailyCloses: [],
        weeklyCloses: [],
        volumes: [],
      }),
      asOf,
      source: hist ? "polygon-historical" : "unavailable",
    });
  }

  return Object.freeze({
    contract: "MARKETDATA_SNAPSHOT_V1",
    asOf,
    symbols: Object.freeze(out),
  });
}
