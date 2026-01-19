// engine/symbolUniverse/resolvers/polygonResolver.js
// POLYGON SYMBOL RESOLVER — V2 (AUTHORITATIVE)
// --------------------------------------------
// Resolves US equities & ETFs via Polygon Reference API
//
// Contract guarantees:
// - symbol (canonical)
// - name (human-readable)
// - assetClass (equity | etf | other)
// - exchange
// - currency
// - country
//
// Rules:
// - Fail-closed
// - Deterministic
// - No UI logic
// - No IPC logic
// - Metadata required (institution-grade)

import fetch from "node-fetch";

const POLYGON_BASE = "https://api.polygon.io/v3/reference/tickers";

export async function polygonResolver(inputSymbol) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return null;

  if (!inputSymbol || typeof inputSymbol !== "string") return null;

  const symbol = inputSymbol.trim().toUpperCase();
  if (!symbol) return null;

  const url = `${POLYGON_BASE}/${encodeURIComponent(symbol)}?apiKey=${apiKey}`;

  try {
    const res = await fetch(url, { timeout: 5000 });
    if (!res.ok) return null;

    const json = await res.json();
    const r = json?.results;
    if (!r || !r.ticker || !r.name) return null;

    // Normalize asset class
    const assetClass =
      r.type === "ETF" ? "etf" :
      r.type === "CS"  ? "equity" :
      "other";

    return Object.freeze({
      symbol: r.ticker,              // Canonical symbol
      name: r.name,                  // ✅ REQUIRED display name
      exchange: r.primary_exchange || "UNKNOWN",
      country: "US",
      currency: "USD",
      assetClass,
      source: "polygonResolver",
      canonical: true
    });
  } catch {
    return null;
  }
}

export default Object.freeze({
  polygonResolver
});
