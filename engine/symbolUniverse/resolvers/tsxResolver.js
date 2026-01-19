// engine/symbolUniverse/resolvers/tsxResolver.js
// TSX SYMBOL RESOLVER — V1 (AUTHORITATIVE)
// ---------------------------------------
// Resolves Toronto Stock Exchange equities and ETFs.
// Canonical form: <TICKER>.TO
// Fail-closed. Deterministic. No guessing.

const TSX_SUFFIX = ".TO";

// Minimal deterministic ETF allowlist (V1)
const TSX_ETF_ALLOWLIST = new Set([
  "XIU.TO",
  "VCN.TO",
  "VFV.TO",
  "ZSP.TO",
  "XIC.TO",
  "XEF.TO",
  "XBB.TO",
  "HXT.TO",
  "HXQ.TO"
]);

function normalizeTsxSymbol(input) {
  if (!input || typeof input !== "string") return null;

  let s = input.trim().toUpperCase();

  // Strip TSX prefix
  if (s.startsWith("TSX:")) {
    s = s.slice(4);
  }

  // Append .TO if missing
  if (!s.endsWith(TSX_SUFFIX)) {
    s = `${s}${TSX_SUFFIX}`;
  }

  // Validate symbol shape
  if (!/^[A-Z0-9.\-]+\.TO$/.test(s)) return null;

  return s;
}

export async function tsxResolver(inputSymbol) {
  const canonical = normalizeTsxSymbol(inputSymbol);
  if (!canonical) return null;

  return Object.freeze({
    symbol: canonical,
    exchange: "TSX",
    country: "CA",
    currency: "CAD",
    assetClass: TSX_ETF_ALLOWLIST.has(canonical) ? "etf" : "equity",
    source: "tsxResolver",
    canonical: true
  });
}

export default Object.freeze({
  tsxResolver
});

