/**
 * RISK_CONTEXT_ENRICHMENT_ENGINE
 * ==============================
 * Phase 14.3 — Risk context enrichment (Chat V2)
 *
 * PURPOSE
 * -------
 * - Derive descriptive, non-opinionated risk context from portfolio structure
 * - Identify concentration, asset-class exposure, and obvious structural risk signals
 * - Provide context ONLY (no scoring, no recommendations)
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
 * “What TYPES of risk are structurally present?”
 */

/* =========================================================
   CONTRACT
========================================================= */

export const RISK_CONTEXT_ENRICHMENT_CONTRACT = {
  name: "RISK_CONTEXT_ENRICHMENT",
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
 *     holdings?: Array<{ symbol: string, assetClass?: string }>
 *     allocation?: object
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
 *   riskContext: {
 *     concentrationRisk: string,
 *     assetClassRisk: string,
 *     diversificationNote: string
 *   },
 *   timestamp: number
 * }
 */

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runRiskContextEnrichment({ portfolioSnapshot } = {}) {
  if (!portfolioSnapshot || !Array.isArray(portfolioSnapshot.holdings)) {
    return {
      contract: RISK_CONTEXT_ENRICHMENT_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      riskContext: {
        concentrationRisk: "Portfolio data unavailable.",
        assetClassRisk: "Asset class exposure unknown.",
        diversificationNote: "Unable to assess diversification.",
      },
      timestamp: Date.now(),
    };
  }

  const holdings = portfolioSnapshot.holdings;
  const symbols = holdings.map(h => h.symbol).filter(Boolean);

  const assetClasses = holdings
    .map(h => h.assetClass)
    .filter(Boolean);

  const uniqueAssetClasses = Array.from(new Set(assetClasses));

  return {
    contract: RISK_CONTEXT_ENRICHMENT_CONTRACT.name,
    status: "READY",
    riskContext: {
      concentrationRisk:
        symbols.length > 5
          ? "Portfolio exhibits multi-asset concentration."
          : "Portfolio is concentrated across a small number of assets.",
      assetClassRisk:
        uniqueAssetClasses.length > 1
          ? "Multiple asset classes present."
          : "Exposure concentrated within a single asset class.",
      diversificationNote:
        "Risk context derived from structural composition only.",
    },
    timestamp: Date.now(),
  };
}
