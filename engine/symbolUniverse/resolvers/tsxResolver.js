// engine/symbolUniverse/resolvers/tsxResolver.js
// TSX SYMBOL RESOLVER — V2 (EXPLICIT-ONLY)
// --------------------------------------
// Resolves Toronto Stock Exchange equities and ETFs
// ONLY when TSX intent is explicit.
//
// Activation rules (ANY must be true):
// 1) Symbol starts with "TSX:"
// 2) Symbol ends with ".TO"
// 3) Symbol is in explicit TSX ETF allowlist
//
// Canonical form: <TICKER>.TO
// Fail-closed. Deterministic. No guessing.
// No US / Crypto / Index fallback.

const TSX_SUFFIX = ".TO";

// Explicit TSX ETF allowlist (V1 — deterministic)
const TSX_ETF_ALLOWLIST = new Set([
  "XIU",
  "VCN",
  "VFV",
  "ZSP",
  "XIC",
  "XEF",
  "XBB",
  "HXT",
  "HXQ"
]);

function hasExplicitTsxIntent(input) {
  if (typeof input !== "string") return false;

  const s = input.trim().toUpperCase();

  if (s.startsWith("TSX:")) return true;
  if (s.endsWith(TSX_SUFFIX)) return true;
  if (TSX_ETF_ALLOWLIST.has(s)) return true;

  return false;
}

function normalizeTsxSymbol(input) {
  let s = input.trim().toUpperCase();

  // Strip TSX prefix if present
  if (s.startsWith("TSX:")) {
    s = s.slice(4);
  }

  // Map explicit ETF shorthand → .TO
  if (TSX_ETF_ALLOWLIST.has(s)) {
    return `${s}${TSX_SUFFIX}`;
  }

  // Must already end with .TO at this point
  if (!s.endsWith(TSX_SUFFIX)) return null;

  // Validate final shape
  if (!/^[A-Z0-9.\-]+\.TO$/.test(s)) return null;

  return s;
}

export async function tsxResolver(inputSymbol) {
  if (!hasExplicitTsxIntent(inputSymbol)) return null;

  const canonical = normalizeTsxSymbol(inputSymbol);
  if (!canonical) return null;

  return Object.freeze({
    symbol: canonical,
    exchange: "TSX",
    country: "CA",
    currency: "CAD",
    assetClass: TSX_ETF_ALLOWLIST.has(canonical.replace(TSX_SUFFIX, ""))
      ? "etf"
      : "equity",
    source: "tsxResolver",
    canonical: true
  });
}

export default Object.freeze({
  tsxResolver
});
