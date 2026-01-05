/**
 * PORTFOLIO_CONTEXT_ENRICHMENT_ENGINE
 * ==================================
 * Phase 14.2 — Portfolio context enrichment (Chat V2)
 *
 * PURPOSE
 * -------
 * - Derive high-level, descriptive portfolio context for Chat V2
 * - Normalize holdings, concentration, and exposure signals
 * - Provide non-opinionated context for downstream synthesis
 *
 * NON-GOALS
 * ---------
 * - No advice
 * - No execution
 * - No recommendations
 * - No mutation
 * - No market prediction
 *
 * This engine answers:
 * “What does the portfolio LOOK like, structurally?”
 */

/* =========================================================
   CONTRACT
========================================================= */

export const PORTFOLIO_CONTEXT_ENRICHMENT_CONTRACT = {
  name: "PORTFOLIO_CONTEXT_ENRICHMENT",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INPUT SHAPE
========================================================= */
/**
 * Expected input:
 * {
 *   portfolioSnapshot: {
 *     holdings?: Array<{ symbol: string }>
 *     allocation?: object
 *     totalValue?: number
 *   }
 * }
 */

/* =========================================================
   OUTPUT SHAPE
========================================================= */
/**
 * Returned structure:
 * {
 *   contract: string,
 *   status: string,
 *   context: {
 *     holdingCount: number,
 *     symbols: string[],
 *     concentrationSummary: string,
 *     assetClassSummary: string
 *   },
 *   timestamp: number
 * }
 */

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runPortfolioContextEnrichment({ portfolioSnapshot } = {}) {
  if (!portfolioSnapshot || !Array.isArray(portfolioSnapshot.holdings)) {
    return {
      contract: PORTFOLIO_CONTEXT_ENRICHMENT_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      context: {
        holdingCount: 0,
        symbols: [],
        concentrationSummary: "Portfolio snapshot unavailable.",
        assetClassSummary: "Unknown asset composition.",
      },
      timestamp: Date.now(),
    };
  }

  const symbols = portfolioSnapshot.holdings
    .map(h => h.symbol)
    .filter(Boolean);

  const holdingCount = symbols.length;

  return {
    contract: PORTFOLIO_CONTEXT_ENRICHMENT_CONTRACT.name,
    status: "READY",
    context: {
      holdingCount,
      symbols,
      concentrationSummary:
        holdingCount > 0
          ? `Portfolio holds ${holdingCount} assets with concentration across ${symbols.join(", ")}.`
          : "No holdings detected.",
      assetClassSummary:
        "Asset class breakdown acknowledged (details deferred).",
    },
    timestamp: Date.now(),
  };
}
