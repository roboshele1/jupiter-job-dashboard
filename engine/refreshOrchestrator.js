// engine/refreshOrchestrator.js

const { getCryptoSnapshot } = require("./cryptoEngine");
const { calculatePortfolioSnapshot } = require("./portfolioMathEngine");

async function orchestrateRefresh() {
  const cryptoAssets = await getCryptoSnapshot();

  const portfolio = calculatePortfolioSnapshot(cryptoAssets);

  return {
    state: "ok",
    portfolio,
  };
}

module.exports = {
  orchestrateRefresh,
};

