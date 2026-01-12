// Public engine surface (Node-only)

import { resolveInvestableSymbol } from "./resolveInvestableSymbol.js";

export async function isInvestableSymbol(symbol) {
  const r = await resolveInvestableSymbol(symbol);
  return Boolean(r?.valid);
}

export { resolveInvestableSymbol };
