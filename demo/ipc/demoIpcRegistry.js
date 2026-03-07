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

  // LCPE execution logging to decision_ledger
  ipcMain.handle("lcpe:recordExecution", async (event, payload) => {
    const fs = require("fs");
    const path = require("path");
    
    const ledgerPath = path.join(__dirname, "../../engine/snapshots/decision_ledger.json");
    
    try {
      let ledger = [];
      if (fs.existsSync(ledgerPath)) {
        const raw = fs.readFileSync(ledgerPath, "utf8");
        ledger = JSON.parse(raw || "[]");
      }
      
      const entry = {
        id: Date.now(),
        ticker: payload.symbol,
        action: "BUY",
        amount_usd: payload.amount,
        date_executed: new Date().toISOString(),
        win_probability_at_time: null,
        lcpe_rank: payload.rank,
        ces_score: payload.cesScore,
        cagr: payload.cagr,
        regime: payload.regime,
        kelly_frac: payload.kellyFrac,
        entry_price: payload.entryPrice,
        outcome_30d: null,
        outcome_60d: null,
        outcome_90d: null
      };
      
      ledger.push(entry);
      fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
      
      return { success: true, entryId: entry.id };
    } catch (err) {
      console.error("[LCPE] recordExecution failed:", err);
      return { success: false, error: err.message };
    }
  });
