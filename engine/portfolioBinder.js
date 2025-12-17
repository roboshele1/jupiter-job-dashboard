// engine/portfolioBinder.js

const { getNormalizedPortfolio } = require("./portfolioAdapter");
const { resolvePrices } = require("./priceResolver");

function buildPositions(inputs) {
  const normalized = getNormalizedPortfolio(inputs.holdings || []);
  const prices = resolvePrices(normalized);

  return normalized.map(asset => {
    const price = prices[asset.assetId] || 0;
    const marketValue = asset.quantity * price;

    return {
      assetId: asset.assetId,
      assetType: asset.assetType,
      quantity: asset.quantity,
      price,
      marketValue,
      allocationPct: 0, // computed later
    };
  });
}

module.exports = {
  buildPositions,
};

