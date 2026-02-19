// engine/symbolUniverse/resolvers/polygonResolver.js
// POLYGON SYMBOL RESOLVER — V3
// -------------------------------------------------------
// FIX 1: Hyphenated symbols (BRK-B → try BRK/B on Polygon)
// FIX 2: name always returned — no silent drops
// FIX 3: Broader asset class coverage (fund, index, warrant)
// FIX 4: Tries original symbol first, then slash form, then dot form
//
// Contract guarantees:
// - symbol (canonical)
// - name   (human-readable — REQUIRED, never omitted)
// - assetClass
// - exchange, currency, country
//
// Rules: fail-closed, deterministic, no UI logic, no IPC logic

import fetch from "node-fetch";

const POLYGON_BASE = "https://api.polygon.io/v3/reference/tickers";

// Polygon uses BRK/B — but users type BRK-B or BRK.B
// We try all known variants before giving up.
function symbolVariants(raw) {
  const s = raw.trim().toUpperCase();
  const variants = [s];

  // BRK-B → BRK/B (Polygon canonical for share classes)
  if (s.includes("-")) {
    variants.push(s.replace(/-/g, "/"));
    variants.push(s.replace(/-/g, "."));
  }

  // BRK/B → BRK-B (user typed slash)
  if (s.includes("/")) {
    variants.push(s.replace(/\//g, "-"));
    variants.push(s.replace(/\//g, "."));
  }

  // BRK.B → BRK/B
  if (s.includes(".") && !s.endsWith(".TO")) {
    variants.push(s.replace(/\./g, "/"));
    variants.push(s.replace(/\./g, "-"));
  }

  // Dedupe while preserving order
  return [...new Set(variants)];
}

function normalizeAssetClass(type) {
  const map = {
    "ETF":    "etf",
    "CS":     "equity",       // Common Stock
    "ADRC":   "equity",       // ADR
    "ADRP":   "equity",
    "ADRR":   "equity",
    "UNIT":   "equity",
    "RIGHT":  "equity",
    "PFD":    "equity",       // Preferred
    "FUND":   "etf",          // Closed-end fund
    "SP":     "etf",          // Structured product
    "WARRANT":"equity",
    "INDEX":  "index",
    "FOREX":  "forex",
    "CRYPTO": "crypto",
  };
  return map[type] || "equity";
}

async function fetchTicker(symbol, apiKey) {
  const url = `${POLYGON_BASE}/${encodeURIComponent(symbol)}?apiKey=${apiKey}`;
  try {
    const res = await fetch(url, { timeout: 6000 });
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.results;
    if (!r?.ticker) return null;
    return r;
  } catch {
    return null;
  }
}

export async function polygonResolver(inputSymbol) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return null;
  if (!inputSymbol || typeof inputSymbol !== "string") return null;

  const variants = symbolVariants(inputSymbol);

  for (const variant of variants) {
    const r = await fetchTicker(variant, apiKey);
    if (!r) continue;

    const name = r.name || r.description || variant; // never drop name

    return Object.freeze({
      symbol:    r.ticker,
      name,                          // ✅ always populated
      exchange:  r.primary_exchange || r.market || "UNKNOWN",
      country:   r.locale === "us" ? "US" : (r.locale || "US").toUpperCase(),
      currency:  r.currency_name?.toUpperCase() || "USD",
      assetClass: normalizeAssetClass(r.type),
      market:    r.market || "stocks",
      source:    "polygonResolver",
      canonical: true,
    });
  }

  return null; // fail-closed
}

export default Object.freeze({ polygonResolver });
