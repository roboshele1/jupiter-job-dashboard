/**
 * DECISION_ENGINE_V1
 * Authoritative portfolio + market aware decision engine
 *
 * RULES:
 * - Engine-only
 * - Deterministic
 * - No IPC
 * - No Electron
 */

import { getGlobalMarketIntelligence } from "../market/marketIntelligence.js";
import { getAuthoritativePortfolio } from "../portfolio/portfolioAuthority.js";

export async function runDecisionEngine(query = {}) {
  const timestamp = Date.now();

  // --- Global Market Context ---
  const globalMarket = getGlobalMarketIntelligence();

  // --- Portfolio Context ---
  const portfolio = await getAuthoritativePortfolio();
  const holdings = portfolio.holdings || [];

  const totalCost = holdings.reduce(
    (sum, h) => sum + (h.totalCostBasis || 0),
    0
  );

  let topHolding = null;
  let topHoldingPct = 0;
  let cryptoExposurePct = 0;

  for (const h of holdings) {
    const pct =
      totalCost > 0 ? (h.totalCostBasis / totalCost) * 100 : 0;

    if (pct > topHoldingPct) {
      topHoldingPct = pct;
      topHolding = h.symbol;
    }

    if (h.assetClass === "crypto") {
      cryptoExposurePct += pct;
    }
  }

  const portfolioOverlay = {
    topHolding,
    topHoldingPct: Number(topHoldingPct.toFixed(2)),
    concentrationRisk:
      topHoldingPct > 40
        ? "HIGH"
        : topHoldingPct > 25
        ? "ELEVATED"
        : "NORMAL",
    cryptoSensitivity:
      cryptoExposurePct > 30
        ? "HIGH"
        : cryptoExposurePct > 15
        ? "SENSITIVE"
        : "LOW"
  };

  // --- Assessment ---
  const assessment = {
    regime: globalMarket.regime.state,
    confidence: globalMarket.regime.confidence,
    posture:
      globalMarket.regime.state === "RISK_ON"
        ? "ALLOW_GROWTH"
        : "DEFENSIVE"
  };

  // --- Guidance ---
  const guidance = {
    allocationBias: globalMarket.implications.favoredAssets,
    cautionAreas: globalMarket.implications.pressuredAssets
  };

  return {
    contract: "DECISION_ENGINE_V1",
    timestamp,
    inputs: { query },
    context: {
      globalMarket,
      portfolioOverlay
    },
    assessment,
    guidance
  };
}
