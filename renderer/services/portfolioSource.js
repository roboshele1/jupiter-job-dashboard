// renderer/services/portfolioSource.js
// Single authoritative holdings source for renderer
// ⚠️ Do NOT compute, mutate, or enrich here

import { holdings as frozenHoldings } from "../state/holdings";

/**
 * Returns normalized holdings array
 * This is the ONLY place real holdings will be injected later
 */
export function getHoldings() {
  return frozenHoldings;
}

