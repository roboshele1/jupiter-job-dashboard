// engine/portfolio/portfolioSnapshotService.js
import { HOLDINGS_REGISTRY } from "./holdingsRegistry.js";
import { getPrices } from "../priceService.js";

export async function calculatePortfolioSnapshot() {
  const symbols = Object.keys(HOLDINGS_REGISTRY);

  const prices = await getPrices(symbols);

  const positions = [];
  let totalValue = 0;
  let totalCost = 0;

  for (const symbol of symbols) {
    const holding = HOLDINGS_REGISTRY[symbol];
    const price = prices[symbol] ?? 0;

    const marketValue = holding.quantity * price;
    const costBasis =
      holding.avgCost !== null
        ? holding.quantity * holding.avgCost
        : null;

    const pnl =
      costBasis !== null ? marketValue - costBasis : null;

    positions.push({
      symbol,
      quantity: holding.quantity,
      avgCost: holding.avgCost,
      price,
      marketValue,
      costBasis,
      pnl,
      source: holding.type
    });

    totalValue += marketValue;
    if (costBasis !== null) totalCost += costBasis;
  }

  return {
    timestamp: new Date().toISOString(),
    totals: {
      value: totalValue,
      cost: totalCost,
      pnl: totalValue - totalCost
    },
    positions
  };
}

