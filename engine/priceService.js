// engine/priceService.js
// JUPITER — Pricing Service (AUTHORITATIVE, READ-ONLY)

import fetch from "node-fetch";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
  throw new Error("POLYGON_API_KEY not set in environment");
}

export async function getLivePrice(symbol, source) {
  if (source === "equity") {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    const price = json?.results?.[0]?.c ?? 0;

    return {
      price,
      source: "polygon",
      timestamp: new Date().toISOString(),
    };
  }

  if (source === "crypto") {
    const pair = symbol === "BTC" ? "X:BTCUSD" : `X:${symbol}USD`;
    const url = `https://api.polygon.io/v2/aggs/ticker/${pair}/prev?apiKey=${POLYGON_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    const price = json?.results?.[0]?.c ?? 0;

    return {
      price,
      source: "polygon",
      timestamp: new Date().toISOString(),
    };
  }

  return {
    price: 0,
    source: "unknown",
    timestamp: new Date().toISOString(),
  };
}

