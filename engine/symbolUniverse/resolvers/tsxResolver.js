// engine/symbolUniverse/resolvers/tsxResolver.js
// TSX SYMBOL RESOLVER — V4 (FULLY OPEN — NO SHORTHAND GATE)
// ----------------------------------------------------------
// Any symbol with explicit TSX intent resolves live via Polygon.
// No hardcoded allowlist. No ETF-only restriction.
// Activation: symbol ends with .TO  OR  starts with TSX:

import fetch from "node-fetch";

const TSX_SUFFIX = ".TO";
const POLYGON_BASE = "https://api.polygon.io/v3/reference/tickers";

export function hasExplicitTsxIntent(input) {
  if (typeof input !== "string") return false;
  const s = input.trim().toUpperCase();
  return s.startsWith("TSX:") || s.endsWith(TSX_SUFFIX);
}

function normalizeTsxSymbol(input) {
  let s = input.trim().toUpperCase();
  if (s.startsWith("TSX:")) s = s.slice(4);
  if (!s.endsWith(TSX_SUFFIX)) s = `${s}${TSX_SUFFIX}`;
  return s;
}

async function lookupPolygon(canonical, apiKey) {
  if (!apiKey) return null;
  const url = `${POLYGON_BASE}/${encodeURIComponent(canonical)}?apiKey=${apiKey}`;
  try {
    const res = await fetch(url, { timeout: 6000 });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.results || null;
  } catch {
    return null;
  }
}

export async function tsxResolver(inputSymbol) {
  if (!hasExplicitTsxIntent(inputSymbol)) return null;

  const canonical = normalizeTsxSymbol(inputSymbol);
  const apiKey    = process.env.POLYGON_API_KEY;
  const ticker    = canonical.replace(TSX_SUFFIX, "");

  const polygonData = await lookupPolygon(canonical, apiKey);
  const name        = polygonData?.name || ticker;
  const type        = polygonData?.type || "";

  return Object.freeze({
    symbol:     canonical,
    name,
    exchange:   "TSX",
    country:    "CA",
    currency:   "CAD",
    assetClass: (type === "ETF" || type === "FUND") ? "etf" : "equity",
    market:     "stocks",
    source:     "tsxResolver",
    canonical:  true,
  });
}

export default Object.freeze({ tsxResolver });
