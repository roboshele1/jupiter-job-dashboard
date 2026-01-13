// electron/ipc/growthCapitalTrajectoryV2Ipc.js
// Capital Trajectory V2 — IPC Surface (Read-Only, Deterministic)

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";

/**
 * CONTRACT:
 * - Read-only
 * - Portfolio snapshot is the sole authority
 * - Supports trajectory + what-if analysis
 * - No recommendations, no mutation
 */

export function registerGrowthCapitalTrajectoryV2Ipc(ipcMain, getSnapshot) {
  ipcMain.handle("growth:capitalTrajectory:v2", async () => {
    const snapshot = await getSnapshot();

    if (!snapshot?.portfolio?.totals?.liveValue) {
      throw new Error("PORTFOLIO_SNAPSHOT_INVALID");
    }

    return Object.freeze(
      await runCapitalTrajectoryV2({
        portfolioSnapshot: {
          contract: "PORTFOLIO_SNAPSHOT_V1",
          timestamp: snapshot.timestamp,
          currency: snapshot.portfolio.currency || "CAD",
          holdings: snapshot.portfolio.positions.map(p => ({
            symbol: p.symbol,
            value: p.liveValue
          })),
          totalValue: snapshot.portfolio.totals.liveValue
        },
        horizonMonths: 60,
        assumptions: {
          baseCAGR: 0.10,
          aggressiveCAGR: 0.18
        }
      })
    );
  });
}
