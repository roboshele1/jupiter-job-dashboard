/**
 * DEMO IPC REGISTRY
 * ----------------
 * Shadow IPC handlers used ONLY in demo mode.
 *
 * HARD RULES:
 * - No engine imports
 * - No network calls
 * - No live data
 * - Deterministic outputs only
 */

const demoSnapshot = require("../snapshots/demoPortfolioSnapshot.json");

function registerDemoIpc(ipcMain) {
  // Portfolio snapshot
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return Object.freeze({
      contract: "DEMO_PORTFOLIO_SNAPSHOT",
      timestamp: Date.now(),
      portfolio: demoSnapshot
    });
  });

  // Growth engine (stubbed intelligence)
  ipcMain.handle("growthEngine:run", async () => {
    return Object.freeze({
      contract: "DEMO_GROWTH_ENGINE",
      note: "Demo mode — logic disabled",
      growthProfile: {
        candidateInjection: {
          outputs: {
            contributions: [
              {
                symbol: "MSTR",
                amount: 20000,
                assumedCAGR: 0.30,
                weight: 0.22,
                contribution: 0.41
              }
            ]
          }
        }
      }
    });
  });

  // Moonshot telemetry (static heartbeat)
  ipcMain.handle("asymmetry:telemetry:get", async () => {
    return Object.freeze({
      size: 1,
      events: [
        {
          id: "demo-1",
          timestamp: new Date().toISOString(),
          regime: "PRIMARY",
          universeSize: 12164,
          evaluated: 12164,
          surfacedCount: 1,
          latentCount: 2,
          snapshot: {
            surfaced: [{ symbol: "NVDA", asymmetryScore: 9.2 }],
            latent: [{ symbol: "MSTR" }, { symbol: "ASML" }]
          }
        }
      ]
    });
  });
}

module.exports = { registerDemoIpc };
