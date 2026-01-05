/**
 * ENRICHMENT_AGGREGATOR
 * =====================
 * Phase 15 → 18 — Enrichment aggregation & ordering
 *
 * PURPOSE
 * -------
 * - Collect all enrichment engines
 * - Enforce deterministic ordering
 * - Produce a single, simple-English context object
 * - NO analysis, NO advice, NO execution
 */

import { runPortfolioContextEnrichment } from "./portfolioContextEnrichment.js";
import { runRiskContextEnrichment } from "./riskContextEnrichment.js";
import { runMarketRegimeContextEnrichment } from "./marketRegimeContextEnrichment.js";
import { runExternalKnowledgeContextEnrichment } from "./externalKnowledgeContextEnrichment.js";

/* =========================================================
   CONTRACT
========================================================= */

export const ENRICHMENT_AGGREGATOR_CONTRACT = {
  name: "ENRICHMENT_AGGREGATOR",
  version: "1.1",
  mode: "READ_ONLY",
  language: "SIMPLE_ENGLISH",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runEnrichmentAggregator({
  portfolioSnapshot = null,
  marketSnapshot = null,
  query = null,
} = {}) {
  const portfolio = runPortfolioContextEnrichment({ portfolioSnapshot });
  const risk = runRiskContextEnrichment({ portfolioSnapshot });
  const market = runMarketRegimeContextEnrichment({ marketSnapshot });

  // NEW — external knowledge (general finance, concepts, definitions)
  const external = runExternalKnowledgeContextEnrichment({ query });

  return {
    contract: ENRICHMENT_AGGREGATOR_CONTRACT.name,
    status: "READY",
    context: {
      portfolioOverview: {
        title: "Portfolio Overview",
        description:
          "This section explains what your portfolio looks like at a high level.",
        details: portfolio.context,
      },
      riskOverview: {
        title: "Risk Overview",
        description:
          "This section explains the types of risk present based on structure only.",
        details: risk.riskContext,
      },
      marketOverview: {
        title: "Market Overview",
        description:
          "This section explains the current market environment in simple terms.",
        details: market.regimeContext,
      },

      // APPENDED — does not interfere with existing sections
      externalKnowledge: external?.context || null,
    },
    language: "SIMPLE_ENGLISH",
    timestamp: Date.now(),
  };
}
