// electron/ipc/dashboardIpc.js
// JUPITER — Dashboard IPC (DERIVED, READ-ONLY)

import { ipcMain } from "electron";
import { calculatePortfolioSnapshot } from "../../engine/portfolio/portfolioSnapshotService.js";

export function registerDashboardIpc() {
  ipcMain.handle("dashboard:getAggregate", async () => {
    const snapshot = await calculatePortfolioSnapshot();

    const pnlPct =
      snapshot.totals.cost > 0
        ? snapshot.totals.pnl / snapshot.totals.cost
        : 0;

    return {
      timestamp: snapshot.timestamp,
      totalValue: snapshot.totals.value,
      pnl: snapshot.totals.pnl,
      pnlPct,
      allocation: {},
      topHoldings: snapshot.positions.slice(0, 5).map((p) => ({
        symbol: p.symbol,
        quantity: p.quantity,
      })),
    };
  });
}

