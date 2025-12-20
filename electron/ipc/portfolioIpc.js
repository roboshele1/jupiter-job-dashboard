// electron/ipc/portfolioIpc.js
// IPC Authority Hard Lock (V1)
// Goal: analytics can enrich, but MUST NOT delete or overwrite canonical positions.

const { ipcMain } = require("electron");
const { getPortfolioSnapshot } = require("../engine/portfolioEngine");
const { computeAnalytics } = require("../engine/portfolioAnalytics");

function registerPortfolioIpc() {
  ipcMain.handle("portfolio:getSnapshot", async () => {
    // 1) Get canonical snapshot from engine
    const canonical = await getPortfolioSnapshot();

    // 2) Compute analytics (may add allocationSummary, etc)
    const enriched = computeAnalytics ? computeAnalytics(canonical) : { ...canonical };

    // 3) HARD LOCK: ensure canonical positions + totals cannot be dropped/overwritten
    enriched.contract = canonical.contract;
    enriched.timestamp = canonical.timestamp;
    enriched.currency = canonical.currency;
    enriched.totalValue = canonical.totalValue;
    enriched.totalCost = canonical.totalCost;
    enriched.positions = canonical.positions;

    // Debug fingerprint: proves IPC path returning canonical 9
    enriched.authority = "IPC_CANONICAL9_LOCK";

    return enriched;
  });

  ipcMain.handle("portfolio:refreshNow", async () => {
    const canonical = await getPortfolioSnapshot();
    const enriched = computeAnalytics ? computeAnalytics(canonical) : { ...canonical };

    enriched.contract = canonical.contract;
    enriched.timestamp = canonical.timestamp;
    enriched.currency = canonical.currency;
    enriched.totalValue = canonical.totalValue;
    enriched.totalCost = canonical.totalCost;
    enriched.positions = canonical.positions;
    enriched.authority = "IPC_CANONICAL9_LOCK";

    return enriched;
  });
}

module.exports = { registerPortfolioIpc };

