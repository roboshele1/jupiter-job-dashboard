// JUPITER Portfolio Engine — v1 CANONICAL
// SINGLE snapshot producer (NON-NEGOTIABLE)

const { v4: uuidv4 } = require("uuid");
const { getHoldings } = require("./holdingsStore");
const { resolvePrices } = require("./priceResolver");

function getPortfolioSnapshot() {
  const holdings = getHoldings();
  const prices = resolvePrices(holdings);

  let investedValue = 0;

  const positions = holdings.map(h => {
    const price = prices[h.assetId] ?? 0;
    const marketValue = h.quantity * price;
    investedValue += marketValue;

    return {
      assetId: h.assetId,
      assetType: h.assetType,
      quantity: h.quantity,
      price,
      marketValue,
      allocationPct: 0
    };
  });

  const portfolioValue = investedValue;

  positions.forEach(p => {
    p.allocationPct =
      portfolioValue > 0
        ? +(p.marketValue / portfolioValue * 100).toFixed(2)
        : 0;
  });

  return {
    meta: {
      snapshotId: uuidv4(),
      version: "v1",
      generatedAt: new Date().toISOString(),
      source: "portfolio-engine"
    },
    totals: {
      portfolioValue,
      cashValue: 0,
      investedValue
    },
    positions,
    performance: {
      unrealizedPL: 0,
      unrealizedPLPct: 0,
      realizedPL: null
    },
    risk: {
      concentrationTopAssetPct: Math.max(...positions.map(p => p.allocationPct), 0),
      assetCount: positions.length
    },
    health: {
      isComplete: true,
      warnings: []
    }
  };
}

module.exports = {
  getPortfolioSnapshot
};

