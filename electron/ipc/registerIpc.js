kconst { registerPortfolioIpc } = require("./portfolioIpc");
const { registerIntelligenceIpc } = require("./intelligenceIpc");

function registerAllIpc(ipcMain) {
  registerPortfolioIpc(ipcMain);
  registerIntelligenceIpc(ipcMain);
}

module.exports = { registerAllIpc };

