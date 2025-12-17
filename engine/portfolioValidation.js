/**
 * JUPITER — Portfolio Validation
 * Activation Phase B — Step 2
 *
 * Validates authoritative holdings before use by engines.
 * Read-only. No mutation. No execution.
 */

import { getAuthoritativeHoldings } from "./portfolioSource";

/**
 * Validation Result Schema:
 * {
 *   symbol,
 *   valid,
 *   reason
 * }
 */

export function validatePortfolioHoldings() {
  const holdings = getAuthoritativeHoldings();

  return holdings.map((h) => {
    let valid = true;
    let reason = "OK";

    if (!h.symbol || typeof h.symbol !== "string") {
      valid = false;
      reason = "Invalid or missing symbol";
    }

    if (typeof h.quantity !== "number" || h.quantity <= 0) {
      valid = false;
      reason = "Invalid quantity";
    }

    if (typeof h.costBasis !== "number" || h.costBasis <= 0) {
      valid = false;
      reason = "Invalid cost basis";
    }

    if (!["EQUITY", "CRYPTO"].includes(h.assetType)) {
      valid = false;
      reason = "Invalid asset type";
    }

    return {
      symbol: h.symbol,
      valid,
      reason,
    };
  });
}

/**
 * Metadata
 */
export const PORTFOLIO_VALIDATION_META = Object.freeze({
  phase: "Activation Phase B",
  step: 2,
  destructive: false,
  executionSafe: true,
});

