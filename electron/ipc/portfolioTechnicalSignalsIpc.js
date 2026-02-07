/**
 * PORTFOLIO TECHNICAL SIGNALS IPC — V1
 *
 * Contract:
 * - Read-only
 * - Engine-only authority
 * - Deterministic snapshot per call
 */

import { buildPortfolioSignalsSnapshot } from "../../engine/portfolioSignals/portfolioSignalsEngine.js";

export function registerPortfolioTechnicalSignalsIpc(ipcMain, getPortfolioSnapshot) {
  ipcMain.handle("portfolio:technicalSignals:getSnapshot", async () => {
    const portfolioSnapshot = await getPortfolioSnapshot();

    if (!portfolioSnapshot?.positions || !portfolioSnapshot?.marketData) {
      throw new Error("Portfolio snapshot unavailable for technical signals");
    }

    const {
      prices,
      dailyCloses,
      weeklyCloses,
      volumes
    } = portfolioSnapshot.marketData;

    return await buildPortfolioSignalsSnapshot({
      priceBySymbol: prices,
      dailyClosesBySymbol: dailyCloses,
      weeklyClosesBySymbol: weeklyCloses,
      volumesBySymbol: volumes,
    });
  });
}
