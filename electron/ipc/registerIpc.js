kconst { registerPortfolioIpc } = require("./portfolioIpc");
const { registerIntelligenceIpc } = require("./intelligenceIpc");
const { registerGrowthEngineIpc } = require("./growthEngineIpc");

function registerAllIpc(ipcMain) {
  registerPortfolioIpc(ipcMain);
  registerIntelligenceIpc(ipcMain);
  registerGrowthEngineIpc(ipcMain);
}

module.exports = { registerAllIpc };

