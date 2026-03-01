const { ipcMain } = require('electron');
const { validatePortfolioConstraints, generateRebalanceRecommendations } = require('../../engine/constraintEngine');
const { portfolioTypes } = require('../../engine/portfolioTypes');
const fs = require('fs');
const path = require('path');

ipcMain.handle('portfolio:validateConstraints', async (event, { holdings, portfolioTypeId = 'CORE_GROWTH' }) => {
  try {
    const portfolioType = portfolioTypes[portfolioTypeId] || portfolioTypes.CORE_GROWTH;
    
    // Read market data from holdings.json
    const holdingsPath = path.join(__dirname, '../../engine/data/holdings.json');
    const holdingsData = JSON.parse(fs.readFileSync(holdingsPath, 'utf8'));
    
    // Build market data from holdings
    const marketData = {};
    holdingsData.forEach(h => {
      marketData[h.symbol] = {
        avgVolume: h.avgVolume || 5000000,
        dividendYield: h.dividendYield || 0,
      };
    });

    const validation = validatePortfolioConstraints(holdings, portfolioType, marketData);
    const recommendations = generateRebalanceRecommendations(holdings, portfolioType, marketData);

    return {
      ok: true,
      data: {
        validation,
        recommendations,
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('portfolio:getTypes', async (event) => {
  return {
    ok: true,
    data: portfolioTypes,
  };
});
