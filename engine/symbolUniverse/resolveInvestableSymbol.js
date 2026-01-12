// Orchestrates resolvers. Valid if ANY resolver succeeds.
// Fail-closed: unresolved => invalid.

import { polygonResolver } from "./resolvers/polygonResolver.js";
import { indexAliasResolver } from "./resolvers/indexAliasResolver.js";
import { coinbaseResolver } from "./resolvers/coinbaseResolver.js";

export async function resolveInvestableSymbol(inputSymbol) {
  const symbol = String(inputSymbol || "").trim().toUpperCase();
  if (!symbol) {
    return { valid: false };
  }

  // Correct precedence:
  // 1) Equities / ETFs (Polygon)
  // 2) Indices (aliases)
  // 3) Crypto (Coinbase)
  const resolvers = [
    polygonResolver,
    indexAliasResolver,
    coinbaseResolver
  ];

  for (const resolver of resolvers) {
    try {
      const result = await resolver(symbol);
      if (result?.valid) {
        return result;
      }
    } catch {
      // continue
    }
  }

  return { valid: false };
}
