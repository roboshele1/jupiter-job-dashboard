// electron/api/portfolioBridge.js

const { ipcMain } = require('electron');
const portfolioEngine = require('../../engine/portfolioEngine');

function registerPortfolioIPC() {
  ipcMain.handle('portfolio:getSnapshot', async () => {
    return portfolioEngine.getPortfolioSnapshot();
  });
}

module.exports = {
  registerPortfolioIPC
};

