/**
 * scripts/livePriceProbe.js
 * Standalone live price probe for Polygon (equities) + Coinbase (crypto)
 * Run with: node scripts/livePriceProbe.js
 */

import fetch from "node-fetch";

// ===== CONFIG =====
const POLYGON_API_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

const EQUITIES = [
  "ASML",
  "NVDA",
  "AVGO",
  "MSTR",
  "HOOD",
  "BMNR",
  "APLD",
];

const CRYPTO = [
  { symbol: "BTC", pair: "BTC-USD" },
  { symbol: "ETH", pair: "ETH-USD" },
];

// ===== HELPERS =====
async function fetchPolygonPrice(symbol) {
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.results || !json.results[0]) {
    throw new Error(`Polygon no data for ${symbol}`);
  }

  return json.results[0].c;
}

async function fetchCoinbasePrice(pair) {
  const url = `https://api.exchange.coinbase.com/products/${pair}/ticker`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.price) {
    throw new Error(`Coinbase no data for ${pair}`);
  }

  return Number(json.price);
}

// ===== MAIN =====
(async () => {
  console.log("\n=== LIVE PRICE PROBE START ===\n");

  const results = {};

  for (const symbol of EQUITIES) {
    const price = await fetchPolygonPrice(symbol);
    results[symbol] = price;
    console.log(`EQUITY ${symbol}: $${price}`);
  }

  for (const c of CRYPTO) {
    const price = await fetchCoinbasePrice(c.pair);
    results[c.symbol] = price;
    console.log(`CRYPTO ${c.symbol}: $${price}`);
  }

  console.log("\n=== FINAL RESULT OBJECT ===");
  console.log(results);
  console.log("\n=== PROBE COMPLETE ===\n");
})();

