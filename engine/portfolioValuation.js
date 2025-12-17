/**
 * JUPITER — Portfolio Valuation Engine
 * Activation Phase C — Step 1
 *
 * Computes live market value and unrealized P/L
 * using authoritative holdings and live market data.
 * Read-only. No execution.
 */

import { getPortfolioHoldings } from "./portfolioContract";
import { getLiveMarketPrices } from "./marketDataContract";

export async function getLivePortfolioValuation() {
  const holdings = getPortfolioHoldings();
  const symbols = holdings.map((h) => h.symbol);

  const prices = await getLiveMarketPrices(symbols);
  const priceMap = new Map(prices.map((p) => [p.symbol, p.price]));

  return holdings.map((h) => {
    const price = priceMap.get(h.symbol);

    if (price === undefined) {
      return {
        ...h,
        price: null,
        marketValue: null,
        pnl: null,
        pnlPct: null,
        valid: false,
        reason: "Missing live price",
      };
    }

    const marketValue = h.quantity * price;
    const costValue = h.quantity * h.costBasis;
    const pnl = marketValue - costValue;
    const pnlPct = costValue !== 0 ? (pnl / costValue) * 100 : null;

    return {
      symbol: h.symbol,
      quantity: h.quantity,
      costBasis: h.costBasis,
      assetType: h.assetType,
      price,
      marketValue,
      pnl,
      pnlPct,
      valid: true,
      reason: "OK",
    };
  });
}

/**
 * Metadata
 */
export const PORTFOLIO_VALUATION_META = Object.freeze({
  phase: "Activation Phase C",
  step: 1,
  live: true,
  executionSafe: true,
});

