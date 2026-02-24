// engine/symbolUniverse/resolveInvestableSymbol.js
// INVESTABLE SYMBOL ORCHESTRATOR — V5 (FULLY GLOBAL)
// ---------------------------------------------------
// Resolution order:
// 1) Explicit TSX (.TO / TSX:)  → tsxResolver
// 2) Crypto                     → coinbaseResolver (live, no allowlist)
// 3) US / global equity + ETF   → polygonResolver
// 4) Canadian bare ticker guess → polygonResolver with .TO suffix
// 5) Index aliases              → indexAliasResolver
// 6) Fail-closed

import { tsxResolver, hasExplicitTsxIntent } from "./resolvers/tsxResolver.js";
import { coinbaseResolver }                   from "./resolvers/coinbaseResolver.js";
import { polygonResolver }                    from "./resolvers/polygonResolver.js";
import { indexAliasResolver }                 from "./resolvers/indexAliasResolver.js";

export async function resolveInvestableSymbol(inputSymbol) {
  if (!inputSymbol || typeof inputSymbol !== "string") {
    return Object.freeze({ valid: false, reason: "INVALID_INPUT" });
  }

  const symbol = inputSymbol.trim().toUpperCase();

  // ── 1) EXPLICIT TSX ──────────────────────────────────────────────────
  if (hasExplicitTsxIntent(symbol)) {
    try {
      const tsx = await tsxResolver(symbol);
      if (tsx?.symbol) return Object.freeze({ valid: true, ...tsx });
    } catch { /* fail-closed */ }
  }

  // ── 2) CRYPTO (Coinbase live — no allowlist) ─────────────────────────
  try {
    const crypto = await coinbaseResolver(symbol);
    if (crypto?.symbol) return Object.freeze({ valid: true, ...crypto });
  } catch { /* fail-closed */ }

  // ── 3) US / GLOBAL EQUITY + ETF (Polygon) ────────────────────────────
  try {
    const equity = await polygonResolver(symbol);
    if (equity?.symbol) return Object.freeze({ valid: true, ...equity });
  } catch { /* fail-closed */ }

  // ── 4) CANADIAN BARE TICKER FALLBACK (e.g. XEQT → XEQT.TO) ─────────
  // Only attempt if ticker is 1-5 uppercase letters — rejects obvious garbage
  if (!symbol.includes(".") && !symbol.includes(":") && /^[A-Z]{1,5}$/.test(symbol)) {
    try {
      const tsx = await tsxResolver(symbol + ".TO");
      if (tsx?.symbol) return Object.freeze({ valid: true, ...tsx });
    } catch { /* fail-closed */ }
  }

  // ── 5) INDEX ALIASES (SPX, NDX, etc.) ────────────────────────────────
  try {
    const index = await indexAliasResolver(symbol);
    if (index?.symbol) return Object.freeze({ valid: true, ...index });
  } catch { /* fail-closed */ }

  // ── 6) FAIL-CLOSED ───────────────────────────────────────────────────
  return Object.freeze({ valid: false, reason: "SYMBOL_NOT_FOUND", symbol });
}
