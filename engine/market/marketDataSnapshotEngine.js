// engine/market/marketDataSnapshotEngine.js
// D10.1 — Canonical Market Data Snapshot Engine (READ-ONLY)

/**
 * Purpose:
 * - Provide deterministic historical market data per symbol
 * - Used by portfolio technical signals & analytics
 * - NO pricing, NO valuation, NO UI
 *
 * Contract:
 * - Engine-only
 * - Read-only
 * - Safe to call on every valuation refresh
 */

import fetch from "node-fetch";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

/**
 * Fetch historical OHLC + volume needed for technical analysis
 */
async function fetchEquityHistory(symbol) {
  if (!POLYGON_API_KEY) return null;

  try {
    // 1y daily bars (safe for SMA / percentiles)
    const dailyUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/365/0?adjusted=true&apiKey=${POLYGON_API_KEY}`;

    // 5y weekly bars (safe for SMA200W)
    const weeklyUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/week/260/0?adjusted=true&apiKey=${POLYGON_API_KEY}`;

    const [dailyRes, weeklyRes] = await Promise.all([
      fetch(dailyUrl),
      fetch(weeklyUrl),
    ]);

    if (!dailyRes.ok || !weeklyRes.ok) return null;

    const dailyJson = await dailyRes.json();
    const weeklyJson = await weeklyRes.json();

    return {
      dailyCloses: dailyJson?.results?.map(r => r.c) ?? [],
      weeklyCloses: weeklyJson?.results?.map(r => r.c) ?? [],
      volumes: dailyJson?.results?.map(r => r.v) ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * PUBLIC API
 */
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
