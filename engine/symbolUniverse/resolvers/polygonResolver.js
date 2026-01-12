// Node-only resolver using Polygon Reference API
// Validates equities, ETFs, and some indices by resolvability

import fetch from "node-fetch";

const POLYGON_BASE = "https://api.polygon.io/v3/reference/tickers";

export async function polygonResolver(symbol) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return null;

  const url = `${POLYGON_BASE}/${encodeURIComponent(symbol)}?apiKey=${apiKey}`;

  try {
    const res = await fetch(url, { timeout: 5000 });
    if (!res.ok) return null;

    const json = await res.json();
    const r = json?.results;
    if (!r || !r.ticker) return null;

    // Asset types Polygon commonly returns: CS (stock), ETF
    const type =
      r.type === "ETF" ? "etf" :
      r.type === "CS" ? "equity" :
      "other";

    return {
      valid: true,
      assetType: type,
      canonicalSymbol: r.ticker,
      source: "polygon"
    };
  } catch {
    return null;
  }
}
