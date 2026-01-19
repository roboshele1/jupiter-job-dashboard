// engine/symbolUniverse/resolveInvestableSymbol.js
// INVESTABLE SYMBOL ORCHESTRATOR — V3 (AUTHORITATIVE)
// --------------------------------------------------
// Single source of truth for symbol validity across:
// - Electron
// - Discovery Lab
// - Manual research
// - Engines
//
// Rules:
// - Valid if ANY resolver succeeds
// - Deterministic precedence
// - Fail-closed
// - No UI logic
// - No IPC logic

import { tsxResolver } from "./resolvers/tsxResolver.js";
import { polygonResolver } from "./resolvers/polygonResolver.js";
import { indexAliasResolver } from "./resolvers/indexAliasResolver.js";
import { coinbaseResolver } from "./resolvers/coinbaseResolver.js";

export async function resolveInvestableSymbol(inputSymbol) {
  if (!inputSymbol || typeof inputSymbol !== "string") {
    return Object.freeze({
      valid: false,
      reason: "INVALID_INPUT"
    });
  }

  const symbol = inputSymbol.trim().toUpperCase();

  // Resolver precedence is EXPLICIT and intentional:
  // 1) TSX equities & ETFs (🇨🇦)
  // 2) US equities & ETFs (🇺🇸 Polygon)
  // 3) Crypto assets (Coinbase)
  // 4) Index aliases (SPX, NDX, etc.)
  const resolvers = [
    tsxResolver,
    polygonResolver,
    coinbaseResolver,
    indexAliasResolver
  ];

  for (const resolver of resolvers) {
    try {
      const result = await resolver(symbol);
      if (result && result.symbol) {
        return Object.freeze({
          valid: true,
          ...result
        });
      }
    } catch {
      // Resolver failure is non-fatal — continue
    }
  }

  return Object.freeze({
    valid: false,
    reason: "UNRESOLVED_SYMBOL"
  });
}

export async function isInvestableSymbol(symbol) {
  const r = await resolveInvestableSymbol(symbol);
  return Boolean(r?.valid);
}

export default Object.freeze({
  resolveInvestableSymbol,
  isInvestableSymbol
});

