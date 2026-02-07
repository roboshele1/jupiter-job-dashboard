/**
 * PORTFOLIO TECHNICAL ANALYSIS IPC — V1 (ALWAYS-ON)
 *
 * Contract:
 * - Read-only
 * - Deterministic
 * - Always returns per-holding technical analysis
 * - Never silent, never gated by signal state
 */

import {
  buildPortfolioTechnicalAnalysis
} from "../../engine/portfolioTechnicalAnalysis/portfolioTechnicalAnalysisEngine.js";

export function registerPortfolioTechnicalSignalsIpc(
  ipcMain,
  getAuthoritativeSnapshot
) {
  ipcMain.handle(
    "portfolio:technicalSignals:getSnapshot",
    async () => {
      const snapshot = await getAuthoritativeSnapshot();
      const portfolio = snapshot?.portfolio;

      if (!portfolio) {
        throw new Error("PORTFOLIO_SNAPSHOT_UNAVAILABLE");
      }

      return buildPortfolioTechnicalAnalysis(portfolio);
    }
  );
}
