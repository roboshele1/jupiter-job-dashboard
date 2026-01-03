// electron/ipc/index.js
// IPC Registry — Canonical Authority Wiring
// No renderer logic allowed here.

const { registerPortfolioIpc } = require("./portfolioIpc");
const { registerAlertsIpc } = require("./alertsIpc");

function registerIpcHandlers() {
  registerPortfolioIpc();
  registerAlertsIpc();
}

module.exports = {
  registerIpcHandlers,
};

