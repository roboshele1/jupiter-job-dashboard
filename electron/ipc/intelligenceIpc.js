const { runIntelligence } = require("../engine/intelligence/intelligenceEngine");

function registerIntelligenceIpc(ipcMain) {
  ipcMain.handle("intelligence:run", async (_event, snapshot, series) => {
    return runIntelligence(snapshot, series);
  });
}

module.exports = { registerIntelligenceIpc };

