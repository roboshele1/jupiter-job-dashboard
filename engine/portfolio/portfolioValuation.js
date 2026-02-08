/**
 * engine/portfolio/portfolioValuation.js
 *
 * PORTFOLIO — SINGLE SOURCE OF TRUTH
 *
 * Responsibilities:
 * - Resolve prices
 * - Build positions
 * - Attach market data
 * - Invoke technical + interpretation engine using REAL portfolio snapshot
 *
 * Invariants:
 * - No UI logic
 * - No IPC logic
 * - No technical engine contract changes
 */

import { resolvePrices } from "../market/priceResolver.js";
import { buildPortfolioTechnicalAnalysis } from "../portfolioTechnicalAnalysis/portfolioTechnicalAnalysisEngine.js";

const CONTRACT = "PORTFOLIO_VALUATION_V2_WITH_TECHNICAL";

export async function valuePortfolio(holdings = []) {
  if (!Array.isArray(holdings)) {
    throw new Error("HOLDINGS_INVALID");
  }

  const asOf = new Date().toISOString();

  // -------------------------
  // PRICE RESOLUTION
  // -------------------------
  const priceSnapshot = await resolvePrices(holdings);

  // -------------------------
  // POSITIONS
  // -------------------------
  const positions = holdings.map((h) => {
    const symbol = String(h.symbol || "").toUpperCase();
    const row = priceSnapshot.prices?.[symbol];

    const price = Number(row?.price) || 0;
    const qty = Number(h.quantity) || 0;

    return {
      symbol,
      assetClass: h.assetClass,
      quantity: qty,
      livePrice: price,
      marketValue: price * qty,
      priceSource: row?.source || "unknown",
      priceFreshness: {
        fetchedAt: row?.fetchedAt || asOf,
      },
    };
  });

  // -------------------------
  // CANONICAL PORTFOLIO SNAPSHOT
  // -------------------------
  const portfolioSnapshot = Object.freeze({
    contract: "PORTFOLIO_SNAPSHOT_V1",
    asOf,
    positions: Object.freeze(positions),
    marketData: Object.freeze({
      contract: priceSnapshot.contract,
      asOf: priceSnapshot.fetchedAt,
      prices: priceSnapshot.prices,
    }),
  });

  // -------------------------
  // TECHNICAL + INTERPRETATION
  // -------------------------
  const technical = await buildPortfolioTechnicalAnalysis(portfolioSnapshot);

  // -------------------------
  // FINAL OUTPUT
  // -------------------------
  return Object.freeze({
    contract: CONTRACT,
    asOf,
    positions,
    marketData: priceSnapshot,
    technical,
  });
}

export default Object.freeze({ valuePortfolio });
