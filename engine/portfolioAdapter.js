// engine/portfolioAdapter.js

function getNormalizedPortfolio(rawHoldings = []) {
  if (!Array.isArray(rawHoldings)) {
    throw new Error("Holdings must be an array");
  }

  return rawHoldings.map(h => ({
    assetId: h.assetId,
    assetType: h.assetType,
    quantity: Number(h.quantity) || 0,
    costBasis: Number(h.costBasis) || 0,
  }));
}

function getPortfolioMetadata() {
  return {
    source: "portfolio-adapter",
    normalizedAt: new Date().toISOString(),
  };
}

module.exports = {
  getNormalizedPortfolio,
  getPortfolioMetadata,
};

