/**
 * portfolioValuation.js
 * ----------------------------------------------------
 * D1 — Async Price Authority Integration
 *
 * Purpose:
 * - Enrich holdings using LIVE price authority
 * - Deterministic fallback when prices unavailable
 * - Preserve contract shape for all upstream engines
 *
 * Rules:
 * - READ-ONLY
 * - NO signal logic
 * - NO execution logic
 */

import { getPrices } from "./priceService.js";

/**
 * pricePortfolio
 * Async valuation using live pricing layer.
 */
export async function pricePortfolio(holdings = []) {
  if (!Array.isArray(holdings)) {
    return { totalValue: 0, positions: [] };
  }

  const symbols = holdings.map(h => h.symbol);

  let prices = {};
  try {
    prices = await getPrices(symbols);
  } catch {
    prices = {};
  }

  let totalValue = 0;

  const positions = holdings.map(h => {
    const qty = h.quantity ?? h.qty ?? 0;
    const livePrice = prices[h.symbol];

    const price =
      typeof livePrice === "number" && !Number.isNaN(livePrice)
        ? livePrice
        : 0;

    const value = price * qty;
    totalValue += value;

    return {
      symbol: h.symbol,
      qty,
      price,
      value
    };
  });

  return { totalValue, positions };
}
