// engine/portfolio/portfolioSnapshotService.js
// JUPITER — Portfolio Snapshot Engine (AUTHORITATIVE)

import { portfolioRegistry } from "./portfolioRegistry.js";
import { getLivePrice } from "../pricing/priceService.js";

export async function calculatePortfolioSnapshot() {
  const registry = portfolioRegistry.getAll();

  const positions = await Promise.all(
    registry.map(async (p) => {
      const priceObj = await getLivePrice(p.symbol, p.source);
      const price = priceObj?.price ?? 0;

      const marketValue = price * p.quantity;
      const costBasis = (p.avgCost ?? 0) * p.quantity;
      const pnl = marketValue - costBasis;

      return {
        symbol: p.symbol,
        quantity: p.quantity,
        avgCost: p.avgCost,
        costBasis,
        price: priceObj,
        marketValue,
        pnl,
        source: p.source,
      };
    })
  );

  const totals = positions.reduce(
    (acc, p) => {
      acc.cost += p.costBasis;
      acc.value += p.marketValue;
      acc.pnl += p.pnl;
      return acc;
    },
    { cost: 0, value: 0, pnl: 0 }
  );

  return {
    timestamp: new Date().toISOString(),
    positions,
    totals,
  };
}

