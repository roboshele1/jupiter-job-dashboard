/**
 * JUPITER — Portfolio Sanity Check
 * Activation Phase B — Step 4
 *
 * Performs a non-destructive sanity pass on validated holdings.
 * No persistence. No execution. Read-only.
 */

import { getPortfolioHoldings } from "./portfolioContract";

/**
 * Sanity Result Schema:
 * {
 *   symbol,
 *   quantity,
 *   costBasis,
 *   assetType,
 *   valid,
 *   reason
 * }
 */

export function runPortfolioSanity() {
  const holdings = getPortfolioHoldings();

  return holdings.map((h) => {
    let valid = true;
    let reason = "OK";

    if (h.quantity > 1_000_000) {
      valid = false;
      reason = "Quantity exceeds sanity threshold";
    }

    if (h.costBasis > 10_000_000) {
      valid = false;
      reason = "Cost basis exceeds sanity threshold";
    }

    return {
      symbol: h.symbol,
      quantity: h.quantity,
      costBasis: h.costBasis,
      assetType: h.assetType,
      valid,
      reason,
    };
  });
}

/**
 * Metadata
 */
export const PORTFOLIO_SANITY_META = Object.freeze({
  phase: "Activation Phase B",
  step: 4,
  destructive: false,
  executionSafe: true,
});

