// engine/portfolioMathEngine.js

function calculatePortfolioSnapshot(assets) {
  let totalValue = 0;

  const enrichedAssets = assets.map(a => {
    const marketValue = a.amount * a.price;
    totalValue += marketValue;

    return {
      ...a,
      marketValue,
    };
  });

  return {
    assets: enrichedAssets,
    totalValue,
    lastCalculatedAt: new Date().toISOString(),
  };
}

module.exports = {
  calculatePortfolioSnapshot,
};

