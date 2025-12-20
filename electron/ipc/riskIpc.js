const { ipcMain } = require("electron");
const { getPortfolioSnapshot } = require("../engine/portfolioEngine");
const { computeRisk } = require("../engine/riskEngine");

function registerRiskIpc() {
  ipcMain.handle("risk:getSnapshot", async () => {
    const snapshot = await getPortfolioSnapshot();
    return computeRisk(snapshot);
  });
}

module.exports = { registerRiskIpc };

