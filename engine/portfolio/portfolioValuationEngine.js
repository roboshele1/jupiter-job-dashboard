// engine/portfolio/portfolioValuationEngine.js
// AUTHORITATIVE portfolio valuation engine
// Engine-first, UI-agnostic, deterministic

import { getMarketMonitorSnapshot } from "../marketMonitorEngine.js";

/**
 * @param {Array} holdings
 * holdings = [
 *  { symbol, quantity, avgCost }
 * ]
 */
export async function getPortfolioValuation(holdings = []) {
  const snapshot = await getMarketMonitorSnapshot();

  if (!snapshot?.assets) {
    throw new Error("Market snapshot unavailable");
  }

  const valuation = [];
  let totalValue = 0;
  let totalCost = 0;

  for (const h of holdings) {
    const price = snapshot.assets[h.symbol]?.price ?? 0;

    const marketValue = h.quantity * price;
    const costBasis = h.quantity * h.avgCost;
    const pnl = marketValue - costBasis;
    const pnlPct = costBasis > 0 ? pnl / costBasis : 0;

    totalValue += marketValue;
    totalCost += costBasis;

    valuation.push({
      symbol: h.symbol,
      quantity: h.quantity,
      avgCost: h.avgCost,
      price,
      marketValue,
      costBasis,
      pnl,
      pnlPct,
      source: snapshot.assets[h.symbol]?.source ?? "unknown",
    });
  }

  return {
    timestamp: snapshot.timestamp,
    totals: {
      value: totalValue,
      cost: totalCost,
      pnl: totalValue - totalCost,
      pnlPct: totalCost > 0 ? (totalValue - totalCost) / totalCost : 0,
    },
    positions: valuation,
  };
}

