const { ipcMain } = require("electron");
const { getPortfolioSnapshot } = require("../../engine/portfolioEngine");

function registerPortfolioIpc() {
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return getPortfolioSnapshot();
  });
}

module.exports = { registerPortfolioIpc };

