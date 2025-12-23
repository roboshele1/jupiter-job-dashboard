// renderer/services/getPortfolioSnapshot.js
// Read-only snapshot facade for renderer

import { getHoldings } from "./portfolioSource";
import {
  getPortfolioSummary,
  getPortfolioAllocation
} from "./portfolioSnapshot";

/**
 * Stable snapshot contract for UI
 * NO UI assumptions
 * NO mutation
 * NO side effects
 */
export async function getPortfolioSnapshot() {
  const holdings = getHoldings();

  return {
    timestamp: new Date().toISOString(),
    summary: getPortfolioSummary(holdings),
    allocation: getPortfolioAllocation(holdings),
    holdings
  };
}

