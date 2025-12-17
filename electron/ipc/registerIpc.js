const { ipcMain } = require("electron");
const { getPortfolioSnapshot } = require("../../engine/portfolioEngine");

function registerIpcHandlers() {
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getPortfolioSnapshot();
  });
}

module.exports = { registerIpcHandlers };

