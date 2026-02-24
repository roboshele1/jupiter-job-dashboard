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

  // VALIDATION GATE — if Polygon returns nothing AND ticker looks fake, reject it
  // A real TSX ticker is 2-5 uppercase letters. Anything longer is almost certainly invalid.
  if (!polygonData) {
    const looksReal = /^[A-Z]{1,5}$/.test(ticker);
    if (!looksReal) return null; // fail-closed for obviously fake symbols
  }

  const name        = polygonData?.name || ticker;
  const type        = polygonData?.type || "";

  // Polygon doesn't recognize many TSX tickers — detect ETFs from name + known prefixes
  const ETF_NAME_KEYWORDS = ["ETF", "FUND", "INDEX", "ISHARES", "VANGUARD", "BMO ", "HORIZONS", "CI ", "MACKENZIE", "INVESCO", "FIDELITY", "TD ", "RBC "];
  const ETF_TICKER_PREFIXES = ["XIU", "XIC", "XEF", "XEC", "XSP", "XEQT", "XGRO", "XBAL", "XCNS", "ZSP", "ZAG", "ZCN", "ZEA", "ZEQT", "ZGRO", "VFV", "VCN", "VAB", "VEQT", "VGRO", "HXT", "HXS", "QQC"];

  const nameUpper = name.toUpperCase();
  const isETFByType = type === "ETF" || type === "FUND" || type === "ETV";
  const isETFByName = ETF_NAME_KEYWORDS.some(k => nameUpper.includes(k));
  const isETFByTicker = ETF_TICKER_PREFIXES.includes(ticker.toUpperCase());

  const assetClass = (isETFByType || isETFByName || isETFByTicker) ? "etf" : "equity";

  return Object.freeze({
    symbol:     canonical,
    name:       polygonData?.name || canonical,
    exchange:   "TSX",
    country:    "CA",
    currency:   "CAD",
    assetClass,
    market:     "stocks",
    source:     "tsxResolver",
    canonical:  true,
  });
}

export default Object.freeze({ tsxResolver });
