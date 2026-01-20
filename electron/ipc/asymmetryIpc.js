/**
 * Asymmetry IPC
 * Read-only bridge between UI and Moonshot Asymmetry Engines
 * NO logic, NO mutation, NO caching
 */

const autonomousMoonshotScanner = require("../../engine/asymmetry/autonomousMoonshotScanner");
const marketDataAdapter = require("../../engine/market/adapters/marketDataAdapter");

module.exports = function registerAsymmetryIpc(ipcMain) {
  /**
   * Pulls full universe, normalizes assets, runs moonshot scan
   */
  ipcMain.handle("asymmetry:scan", async (_event, { universe }) => {
    if (!Array.isArray(universe)) {
      throw new Error("Universe must be an array");
    }

    const hydrated = [];

    for (const u of universe) {
      if (!u?.symbol) continue;

      try {
        const asset = await marketDataAdapter(u.symbol);
        hydrated.push(asset);
      } catch (err) {
        hydrated.push({
          symbol: u.symbol,
          status: "ERROR",
          error: err.message
        });
      }
    }

    return autonomousMoonshotScanner(hydrated);
  });
};
