const { ipcMain } = require('electron');
const { analyzePortfolio } = require('../../engine/advancedAnalytics');

ipcMain.handle('portfolio:analyzeMetrics', async (event, { portfolioValue, holdings, priceHistories }) => {
  try {
    const analytics = analyzePortfolio(portfolioValue, holdings, priceHistories);

    return {
      ok: true,
      data: {
        sharpeRatio: analytics.sharpeRatio.toFixed(3),
        sortinoRatio: analytics.sortinoRatio.toFixed(3),
        volatility: (analytics.volatility * 100).toFixed(2) + '%',
        maxDrawdown: (analytics.maxDrawdown * 100).toFixed(2) + '%',
        calmarRatio: analytics.calmarRatio.toFixed(3),
        totalReturn: (analytics.totalReturn * 100).toFixed(2) + '%',
        correlationMatrix: analytics.correlationMatrix,
        holdingsVolatility: Object.keys(analytics.holdingsVolatility).reduce((acc, sym) => {
          acc[sym] = (analytics.holdingsVolatility[sym] * 100).toFixed(2) + '%';
          return acc;
        }, {}),
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
