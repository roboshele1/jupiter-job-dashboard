const { ipcMain } = require("electron");
const signalsEngine = require("../../engine/signalsEngine");

function registerSignalsIPC() {
  ipcMain.handle("signals:getSnapshot", async () => {
    return signalsEngine.getSignalsSnapshot();
  });
}

module.exports = {
  registerSignalsIPC
};

